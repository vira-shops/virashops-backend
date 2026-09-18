import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';
import BankAccountValidationStatus from '../../../domain/model/enums/bank-account-validation-status.enum';

export const bankAccountValidations = pgTable('bank_account_validations', {
  id: idColumn(),
  ...timestamps(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fullName: varchar('full_name', { length: 160 }).notNull(),
  accountNumber: varchar('account_number', { length: 40 }).notNull(),
  nationalId: varchar('national_id', { length: 10 }).notNull(),
  branchCode: varchar('branch_code', { length: 20 }).notNull(),
  creditGrade: varchar('credit_grade', { length: 8 }),
  creditCeiling: integer('credit_ceiling'),
  provider: varchar('provider', { length: 30 }).notNull().default('STUB'),
  providerRef: varchar('provider_ref', { length: 120 }),
  status: varchar('status', { length: 30 })
    .notNull()
    .default(BankAccountValidationStatus.SUCCEEDED),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export type BankAccountValidationRow =
  typeof bankAccountValidations.$inferSelect;
