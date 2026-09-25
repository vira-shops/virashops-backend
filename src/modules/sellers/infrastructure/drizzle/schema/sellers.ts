import {
  integer,
  pgTable,
  text,
  unique,
  varchar,
  date,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import SellerStatus from '../../../domain/model/enums/seller-status.enum';

export const sellers = pgTable(
  'sellers',
  {
    id: idColumn(),
    ...timestamps(),
    userId: integer('user_id').notNull(),
    kind: varchar('kind', { length: 20 }).notNull(),
    shopName: varchar('shop_name', { length: 160 }),
    workplacePhone: varchar('workplace_phone', { length: 20 }),
    province: varchar('province', { length: 80 }),
    city: varchar('city', { length: 80 }),
    postalCode: varchar('postal_code', { length: 10 }),
    salesType: varchar('sales_type', { length: 20 }),
    address: text('address'),
    industryType: varchar('industry_type', { length: 120 }).notNull(),
    category: varchar('category', { length: 120 }).notNull(),
    activityType: varchar('activity_type', { length: 80 }).notNull(),
    documentType: varchar('document_type', { length: 32 }).notNull(),
    documentKey: varchar('document_key', { length: 255 }).notNull(),
    nationalId: varchar('national_id', { length: 10 }),
    dateOfBirth: date('date_of_birth'),
    gender: varchar('gender', { length: 10 }),
    avatarKey: varchar('avatar_key', { length: 255 }),
    status: varchar('status', { length: 20 })
      .notNull()
      .default(SellerStatus.PENDING),
  },
  (table) => [unique('UQ_sellers_user_id').on(table.userId)],
);

export const sellerWarehouses = pgTable('seller_warehouses', {
  id: idColumn(),
  ...timestamps(),
  sellerId: integer('seller_id')
    .notNull()
    .references(() => sellers.id, { onDelete: 'cascade' }),
  phone: varchar('phone', { length: 20 }),
  postalCode: varchar('postal_code', { length: 10 }),
  city: varchar('city', { length: 80 }),
  address: text('address'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type SellerRow = typeof sellers.$inferSelect;
export type SellerWarehouseRow = typeof sellerWarehouses.$inferSelect;
