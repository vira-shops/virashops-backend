import { integer, pgTable, unique } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';

export const favorites = pgTable(
  'favorites',
  {
    id: idColumn(),
    ...timestamps(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: integer('product_id').notNull(),
  },
  (table) => [
    unique('UQ_favorites_user_product').on(table.userId, table.productId),
  ],
);

export type FavoriteRow = typeof favorites.$inferSelect;
