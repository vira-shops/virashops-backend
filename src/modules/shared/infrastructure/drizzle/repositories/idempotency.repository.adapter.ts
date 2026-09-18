import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import IdempotencyRepositoryPort, {
  type IdempotencyRecord,
  type ReserveIdempotencyInput,
} from '../../../application/ports/idempotency.repository.port';
import IdempotencyStatus from '../../../domain/model/enums/idempotency-status.enum';
import IdempotencyMapper from '../mappers/idempotency.mapper';
import { idempotencyRecords } from '../schema/idempotency-records';

@Injectable()
export default class DrizzleIdempotencyRepositoryAdapter implements IdempotencyRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async tryInsertProcessing(
    input: ReserveIdempotencyInput,
  ): Promise<IdempotencyRecord | null> {
    const inserted = await this.db
      .insert(idempotencyRecords)
      .values({
        actorType: input.actorType,
        actorId: input.actorId,
        endpoint: input.endpoint,
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        status: IdempotencyStatus.PROCESSING,
        expiresAt: input.expiresAt,
      })
      .onConflictDoNothing()
      .returning();

    const row = inserted[0];
    return row ? IdempotencyMapper.toDomain(row) : null;
  }

  async findByActorEndpointKey(
    actorType: string,
    actorId: string,
    endpoint: string,
    idempotencyKey: string,
  ): Promise<IdempotencyRecord | null> {
    const row = await this.db.query.idempotencyRecords.findFirst({
      where: and(
        eq(idempotencyRecords.actorType, actorType),
        eq(idempotencyRecords.actorId, actorId),
        eq(idempotencyRecords.endpoint, endpoint),
        eq(idempotencyRecords.idempotencyKey, idempotencyKey),
        isNull(idempotencyRecords.deletedAt),
      ),
    });
    return row ? IdempotencyMapper.toDomain(row) : null;
  }

  async resetExpiredToProcessing(
    id: number,
    requestHash: string,
    expiresAt: Date,
  ): Promise<IdempotencyRecord | null> {
    const updated = await this.db
      .update(idempotencyRecords)
      .set({
        status: IdempotencyStatus.PROCESSING,
        requestHash,
        expiresAt,
        statusCode: null,
        responseBody: null,
        resourceId: null,
      })
      .where(
        and(
          eq(idempotencyRecords.id, id),
          lt(idempotencyRecords.expiresAt, new Date()),
        ),
      )
      .returning();
    const row = updated[0];
    return row ? IdempotencyMapper.toDomain(row) : null;
  }

  async reclaimFailedToProcessing(
    id: number,
    requestHash: string,
    expiresAt: Date,
  ): Promise<IdempotencyRecord | null> {
    const updated = await this.db
      .update(idempotencyRecords)
      .set({
        status: IdempotencyStatus.PROCESSING,
        requestHash,
        expiresAt,
        statusCode: null,
        responseBody: null,
        resourceId: null,
      })
      .where(
        and(
          eq(idempotencyRecords.id, id),
          eq(idempotencyRecords.status, IdempotencyStatus.FAILED),
          eq(idempotencyRecords.requestHash, requestHash),
        ),
      )
      .returning();
    const row = updated[0];
    return row ? IdempotencyMapper.toDomain(row) : null;
  }

  async complete(
    id: number,
    statusCode: number,
    responseBody: unknown,
    resourceId: string | null,
  ): Promise<void> {
    await this.db
      .update(idempotencyRecords)
      .set({
        status: IdempotencyStatus.COMPLETED,
        statusCode,
        responseBody,
        resourceId,
      })
      .where(eq(idempotencyRecords.id, id));
  }

  async fail(id: number): Promise<void> {
    await this.db
      .update(idempotencyRecords)
      .set({ status: IdempotencyStatus.FAILED })
      .where(eq(idempotencyRecords.id, id));
  }

  async release(id: number): Promise<void> {
    await this.db
      .delete(idempotencyRecords)
      .where(eq(idempotencyRecords.id, id));
  }
}
