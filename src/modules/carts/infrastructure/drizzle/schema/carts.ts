import { integer, pgTable, unique, varchar } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';
import CartChannel from '../../../domain/model/enums/cart-channel.enum';

export const carts = pgTable(
  'carts',
  {
    id: idColumn(),
    ...timestamps(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: varchar('channel', { length: 20 })
      .notNull()
      .default(CartChannel.WHOLESALE),
  },
  (table) => [unique('UQ_carts_user_id').on(table.userId)],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: idColumn(),
    ...timestamps(),
    cartId: integer('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: integer('product_id').notNull(),
    sellerId: integer('seller_id').notNull(),
    sellerShopName: varchar('seller_shop_name', { length: 160 }).notNull(),
    sellerLogoKey: varchar('seller_logo_key', { length: 255 }),
    productNameFa: varchar('product_name_fa', { length: 255 }).notNull(),
    productNameEn: varchar('product_name_en', { length: 255 }).notNull(),
    imageKey: varchar('image_key', { length: 255 }),
    packQty: integer('pack_qty').notNull().default(0),
    pieceQty: integer('piece_qty').notNull().default(0),
    packMultiple: integer('pack_multiple').notNull().default(1),
    unitPrice: integer('unit_price').notNull(),
    packPrice: integer('pack_price').notNull(),
    commissionPercent: integer('commission_percent').notNull().default(5),
    prepaymentAmount: integer('prepayment_amount').notNull().default(0),
  },
  (table) => [
    unique('UQ_cart_items_cart_product').on(table.cartId, table.productId),
  ],
);

export type CartRow = typeof carts.$inferSelect;
export type CartItemRow = typeof cartItems.$inferSelect;
