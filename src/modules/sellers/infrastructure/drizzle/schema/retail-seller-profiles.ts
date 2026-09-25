import {
  date,
  integer,
  numeric,
  pgTable,
  text,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';

export const retailSellerProfiles = pgTable(
  'retail_seller_profiles',
  {
    id: idColumn(),
    ...timestamps(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 160 }),
    occupation: varchar('occupation', { length: 80 }),
    nationalId: varchar('national_id', { length: 10 }),
    dateOfBirth: date('date_of_birth'),
    gender: varchar('gender', { length: 10 }),
    avatarKey: varchar('avatar_key', { length: 255 }),
    province: varchar('province', { length: 80 }),
    city: varchar('city', { length: 80 }),
    address: text('address'),
    postalCode: varchar('postal_code', { length: 10 }),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
  },
  (table) => [unique('UQ_retail_seller_profiles_user_id').on(table.userId)],
);

export type RetailSellerProfileRow = typeof retailSellerProfiles.$inferSelect;
