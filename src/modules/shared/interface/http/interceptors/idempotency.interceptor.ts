import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, from, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import IdempotencyService from '../../../domain/application/services/idempotency.service';
import IdempotencyKeyRequiredError from '../../../domain/errors/idempotency-key-required.error';
import { IDEMPOTENCY_META_KEY } from '../decorators/require-idempotency.decorator';

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

@Injectable()
export default class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly idempotency: IdempotencyService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const required = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENCY_META_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const rawKey = request.header('idempotency-key')?.trim();
    if (!rawKey || !KEY_PATTERN.test(rawKey)) {
      return throwError(() => new IdempotencyKeyRequiredError());
    }

    const user = request.user;
    if (!user) {
      return throwError(() => new IdempotencyKeyRequiredError());
    }

    const routePath =
      (request.route as { path?: string } | undefined)?.path ?? request.path;
    const endpoint = `${request.method}:${routePath}`;
    const requestHash = IdempotencyService.hashBody(request.body);
    const actorType = 'user';
    const actorId = String(user.getId());
    const lockKey = `idem:${actorType}:${actorId}:${endpoint}:${rawKey}`;

    return from(
      this.idempotency.reserve({
        actorType,
        actorId,
        endpoint,
        idempotencyKey: rawKey,
        requestHash,
      }),
    ).pipe(
      mergeMap((outcome) => {
        if (outcome.kind === 'replay') {
          response.status(outcome.statusCode);
          return from([
            {
              status: outcome.statusCode,
              data: outcome.responseBody,
            },
          ]);
        }

        const record = outcome.record;
        const lockToken = outcome.lockToken;

        return next.handle().pipe(
          mergeMap((body: unknown) =>
            from(
              (async () => {
                const statusCode =
                  typeof body === 'object' &&
                  body !== null &&
                  typeof (body as { status?: unknown }).status === 'number'
                    ? (body as { status: number }).status
                    : response.statusCode || 200;
                const data: unknown =
                  typeof body === 'object' && body !== null && 'data' in body
                    ? body.data
                    : body;
                const resourceId =
                  typeof data === 'object' &&
                  data !== null &&
                  'id' in data &&
                  (typeof data.id === 'number' || typeof data.id === 'string')
                    ? String((data as { id: string | number }).id)
                    : null;
                await this.idempotency.complete(
                  record.id,
                  statusCode,
                  data,
                  resourceId,
                );
                await this.idempotency.releaseLock(lockKey, lockToken);
                return body;
              })(),
            ),
          ),
          catchError((err) =>
            from(
              (async () => {
                await this.idempotency.onHandlerError(record.id, err);
                await this.idempotency.releaseLock(lockKey, lockToken);
                throw err;
              })(),
            ),
          ),
        );
      }),
    );
  }
}
