import type { IdempotencyRecord } from '../../../application/ports/idempotency.repository.port';
import IdempotencyStatus from '../../../domain/model/enums/idempotency-status.enum';
import type { IdempotencyRecordRow } from '../schema/idempotency-records';

export default class IdempotencyMapper {
  static toDomain(row: IdempotencyRecordRow): IdempotencyRecord {
    return {
      id: row.id,
      actorType: row.actorType,
      actorId: row.actorId,
      endpoint: row.endpoint,
      idempotencyKey: row.idempotencyKey,
      requestHash: row.requestHash,
      status: row.status as IdempotencyStatus,
      statusCode: row.statusCode,
      responseBody: row.responseBody,
      resourceId: row.resourceId,
      expiresAt: row.expiresAt,
    };
  }
}
