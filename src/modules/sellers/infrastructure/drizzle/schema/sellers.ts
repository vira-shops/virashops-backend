import { integer, pgTable, text, unique, varchar } from 'drizzle-orm/pg-core';
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
    status: varchar('status', { length: 20 })
      .notNull()
      .default(SellerStatus.PENDING),
  },
  (table) => [unique('UQ_sellers_user_id').on(table.userId)],
);

export type SellerRow = typeof sellers.$inferSelect;
