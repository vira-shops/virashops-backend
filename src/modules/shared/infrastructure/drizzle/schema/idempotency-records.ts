import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import IdempotencyStatus from '../../../domain/model/enums/idempotency-status.enum';

export const idempotencyRecords = pgTable(
  'idempotency_records',
  {
    id: idColumn(),
    ...timestamps(),
    actorType: varchar('actor_type', { length: 16 }).notNull(),
    actorId: varchar('actor_id', { length: 64 }).notNull(),
    endpoint: varchar('endpoint', { length: 150 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull(),
    requestHash: varchar('request_hash', { length: 64 }).notNull(),
    status: varchar('status', { length: 20 })
      .notNull()
      .default(IdempotencyStatus.PROCESSING),
    statusCode: integer('status_code'),
    responseBody: jsonb('response_body'),
    resourceId: varchar('resource_id', { length: 64 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    unique('UQ_idempotency_actor_endpoint_key').on(
      table.actorType,
      table.actorId,
      table.endpoint,
      table.idempotencyKey,
    ),
    index('IDX_idempotency_expires_at').on(table.expiresAt),
  ],
);

export type IdempotencyRecordRow = typeof idempotencyRecords.$inferSelect;
