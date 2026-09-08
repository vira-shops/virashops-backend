import {
  AnyPgColumn,
  integer,
  pgTable,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import CategoryStatus from '../../../domain/model/enums/category-status.enum';

export const categories = pgTable(
  'categories',
  {
    id: idColumn(),
    ...timestamps(),
    parentId: integer('parent_id').references(
      (): AnyPgColumn => categories.id,
      {
        onDelete: 'restrict',
      },
    ),
    slug: varchar('slug', { length: 80 }).notNull(),
    nameFa: varchar('name_fa', { length: 120 }).notNull(),
    nameEn: varchar('name_en', { length: 120 }).notNull(),
    status: varchar('status', { length: 20 })
      .notNull()
      .default(CategoryStatus.ACTIVE),
    sortOrder: integer('sort_order').notNull().default(0),
    iconKey: varchar('icon_key', { length: 80 }),
    imageKey: varchar('image_key', { length: 80 }),
    depth: integer('depth').notNull(),
  },
  (table) => [unique('UQ_categories_slug').on(table.slug)],
);

export type CategoryRow = typeof categories.$inferSelect;
