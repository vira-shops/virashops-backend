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
import { users } from '../../../../users/infrastructure/drizzle/schema/users';
import type { ChequePlanItem } from '../../../domain/model/cheque-submission.model';
import ChequeRejectionReason from '../../../domain/model/enums/cheque-rejection-reason.enum';
import ChequeVerificationStatus from '../../../domain/model/enums/cheque-verification-status.enum';
import { payments } from './payments';

export const chequeSubmissions = pgTable(
  'cheque_submissions',
  {
    id: idColumn(),
    ...timestamps(),
    paymentId: integer('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name', { length: 160 }).notNull(),
    accountNumber: varchar('account_number', { length: 40 }).notNull(),
    nationalId: varchar('national_id', { length: 10 }).notNull(),
    branchCode: varchar('branch_code', { length: 20 }).notNull(),
    status: varchar('status', { length: 30 })
      .notNull()
      .default(ChequeVerificationStatus.AWAITING_REVIEW),
    rejectionReason: varchar('rejection_reason', { length: 500 }),
    rejectionReasons: jsonb('rejection_reasons')
      .$type<ChequeRejectionReason[]>()
      .notNull()
      .default([]),
    reviewedByUserId: integer('reviewed_by_user_id').references(
      () => users.id,
      {
        onDelete: 'set null',
      },
    ),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    cadence: varchar('cadence', { length: 30 }),
    downPayment: integer('down_payment'),
    planItems: jsonb('plan_items')
      .$type<ChequePlanItem[]>()
      .notNull()
      .default([]),
  },
  (table) => [
    unique('UQ_cheque_submissions_payment_id').on(table.paymentId),
    index('IDX_cheque_submissions_status').on(table.status),
  ],
);

export const chequeSubmissionPhotos = pgTable('cheque_submission_photos', {
  id: idColumn(),
  ...timestamps(),
  submissionId: integer('submission_id')
    .notNull()
    .references(() => chequeSubmissions.id, { onDelete: 'cascade' }),
  imageKey: varchar('image_key', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type ChequeSubmissionRow = typeof chequeSubmissions.$inferSelect;
export type ChequeSubmissionPhotoRow =
  typeof chequeSubmissionPhotos.$inferSelect;
