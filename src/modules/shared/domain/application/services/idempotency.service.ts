import { createHash, randomUUID } from 'crypto';
import { HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
import type IdempotencyLockPort from '../../../application/ports/idempotency.lock.port';
import type IdempotencyRepositoryPort from '../../../application/ports/idempotency.repository.port';
import type { IdempotencyRecord } from '../../../application/ports/idempotency.repository.port';
import {
  IDEMPOTENCY_LOCK,
  IDEMPOTENCY_REPOSITORY,
} from '../../../tokens/port.tokens';
import { DomainError } from '../../errors/domain-error';
import IdempotencyInProgressError from '../../errors/idempotency-in-progress.error';
import IdempotencyKeyReusedError from '../../errors/idempotency-key-reused.error';
import IdempotencyStatus from '../../model/enums/idempotency-status.enum';

const TTL_MS = 24 * 60 * 60 * 1000;
const LOCK_TTL_SECONDS = 30;

export type ReserveOutcome =
  | { kind: 'owner'; record: IdempotencyRecord; lockToken: string | null }
  | {
      kind: 'replay';
      statusCode: number;
      responseBody: unknown;
    };

@Injectable()
export default class IdempotencyService {
  constructor(
    @Inject(IDEMPOTENCY_REPOSITORY)
    private readonly repository: IdempotencyRepositoryPort,
    @Optional()
    @Inject(IDEMPOTENCY_LOCK)
    private readonly lock?: IdempotencyLockPort,
  ) {}

  static hashBody(body: unknown): string {
    return createHash('sha256')
      .update(stableStringify(body ?? {}))
      .digest('hex');
  }

  async reserve(input: {
    actorType: string;
    actorId: string;
    endpoint: string;
    idempotencyKey: string;
    requestHash: string;
  }): Promise<ReserveOutcome> {
    const expiresAt = new Date(Date.now() + TTL_MS);
    const lockKey = `idem:${input.actorType}:${input.actorId}:${input.endpoint}:${input.idempotencyKey}`;
    let lockToken: string | null = null;

    if (this.lock) {
      lockToken = randomUUID();
      const acquired = await this.lock.tryAcquire(
        lockKey,
        lockToken,
        LOCK_TTL_SECONDS,
      );
      if (!acquired) {
        throw new IdempotencyInProgressError();
      }
    }

    try {
      const inserted = await this.repository.tryInsertProcessing({
        ...input,
        expiresAt,
      });
      if (inserted) {
        return { kind: 'owner', record: inserted, lockToken };
      }

      const existing = await this.repository.findByActorEndpointKey(
        input.actorType,
        input.actorId,
        input.endpoint,
        input.idempotencyKey,
      );
      if (!existing) {
        throw new IdempotencyInProgressError();
      }

      if (existing.expiresAt.getTime() < Date.now()) {
        const reset = await this.repository.resetExpiredToProcessing(
          existing.id,
          input.requestHash,
          expiresAt,
        );
        if (!reset) {
          throw new IdempotencyInProgressError();
        }
        return { kind: 'owner', record: reset, lockToken };
      }

      if (existing.requestHash !== input.requestHash) {
        throw new IdempotencyKeyReusedError();
      }

      if (existing.status === IdempotencyStatus.COMPLETED) {
        // Not owning a processing turn — release before returning replay.
        if (lockToken && this.lock) {
          await this.lock.release(lockKey, lockToken);
        }
        return {
          kind: 'replay',
          statusCode: existing.statusCode ?? HttpStatus.OK,
          responseBody: existing.responseBody,
        };
      }

      if (existing.status === IdempotencyStatus.FAILED) {
        const reclaimed = await this.repository.reclaimFailedToProcessing(
          existing.id,
          input.requestHash,
          expiresAt,
        );
        if (!reclaimed) {
          throw new IdempotencyInProgressError();
        }
        return { kind: 'owner', record: reclaimed, lockToken };
      }

      throw new IdempotencyInProgressError();
    } catch (error) {
      if (lockToken && this.lock) {
        await this.lock.release(lockKey, lockToken);
      }
      throw error;
    }
  }

  async complete(
    id: number,
    statusCode: number,
    responseBody: unknown,
    resourceId: string | null = null,
  ): Promise<void> {
    await this.repository.complete(id, statusCode, responseBody, resourceId);
  }

  async release(id: number): Promise<void> {
    await this.repository.release(id);
  }

  async fail(id: number): Promise<void> {
    await this.repository.fail(id);
  }

  async onHandlerError(id: number, err: unknown): Promise<void> {
    if (err instanceof DomainError) {
      if (
        err.status === HttpStatus.BAD_REQUEST ||
        err.status === HttpStatus.UNAUTHORIZED ||
        err.status === HttpStatus.FORBIDDEN
      ) {
        await this.release(id);
        return;
      }
    }
    await this.fail(id);
  }

  async releaseLock(lockKey: string, lockToken: string | null): Promise<void> {
    if (lockToken && this.lock) {
      await this.lock.release(lockKey, lockToken);
    }
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
    .join(',')}}`;
}
