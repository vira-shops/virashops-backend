import {
  integer,
  pgTable,
  text,
  unique,
  varchar,
  date,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from './users';

export const buyerProfiles = pgTable(
  'buyer_profiles',
  {
    id: idColumn(),
    ...timestamps(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nationalId: varchar('national_id', { length: 10 }),
    dateOfBirth: date('date_of_birth'),
    gender: varchar('gender', { length: 10 }),
    avatarKey: varchar('avatar_key', { length: 255 }),
    businessName: varchar('business_name', { length: 160 }),
    businessPhone: varchar('business_phone', { length: 20 }),
    postalCode: varchar('postal_code', { length: 20 }),
    province: varchar('province', { length: 80 }),
    city: varchar('city', { length: 80 }),
    address: text('address'),
    identityType: varchar('identity_type', { length: 20 }),
    documentKey1: varchar('document_key_1', { length: 255 }),
    documentKey2: varchar('document_key_2', { length: 255 }),
  },
  (table) => [unique('UQ_buyer_profiles_user_id').on(table.userId)],
);

export type BuyerProfileRow = typeof buyerProfiles.$inferSelect;
