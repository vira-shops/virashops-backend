import { integer, pgTable, unique, varchar } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';
import PaymentStatus from '../../../domain/model/enums/payment-status.enum';
import { bankAccountValidations } from './bank-account-validations';

export const payments = pgTable(
  'payments',
  {
    id: idColumn(),
    ...timestamps(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    checkoutSessionId: integer('checkout_session_id').notNull(),
    orderId: integer('order_id'),
    method: varchar('method', { length: 30 }).notNull(),
    amount: integer('amount').notNull(),
    status: varchar('status', { length: 30 })
      .notNull()
      .default(PaymentStatus.PENDING),
    providerRef: varchar('provider_ref', { length: 120 }),
    redirectUrl: varchar('redirect_url', { length: 500 }),
    bankAccountValidationId: integer('bank_account_validation_id').references(
      () => bankAccountValidations.id,
      { onDelete: 'set null' },
    ),
  },
  (table) => [unique('UQ_payments_provider_ref').on(table.providerRef)],
);

export type PaymentRow = typeof payments.$inferSelect;
