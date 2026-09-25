import { boolean, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';

export const addresses = pgTable('addresses', {
  id: idColumn(),
  ...timestamps(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 120 }).notNull(),
  line1: varchar('line1', { length: 255 }).notNull(),
  line2: varchar('line2', { length: 255 }),
  city: varchar('city', { length: 120 }).notNull(),
  province: varchar('province', { length: 120 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }),
  recipientFullName: varchar('recipient_full_name', { length: 160 }).notNull(),
  recipientPhone: varchar('recipient_phone', { length: 11 }).notNull(),
  nationalId: varchar('national_id', { length: 10 }).notNull(),
  houseNumber: varchar('house_number', { length: 40 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
});

export type AddressRow = typeof addresses.$inferSelect;
