import { integer, jsonb, pgTable, unique, varchar } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';
import CheckoutSessionStatus from '../../../domain/model/enums/checkout-session-status.enum';
import OrderPaymentStatus from '../../../domain/model/enums/order-payment-status.enum';
import OrderStatus from '../../../domain/model/enums/order-status.enum';

export const checkoutSessions = pgTable('checkout_sessions', {
  id: idColumn(),
  ...timestamps(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sellerId: integer('seller_id').notNull(),
  sellerShopName: varchar('seller_shop_name', { length: 160 }).notNull(),
  sellerLogoKey: varchar('seller_logo_key', { length: 255 }),
  status: varchar('status', { length: 30 })
    .notNull()
    .default(CheckoutSessionStatus.AWAITING_PAYMENT),
  address: jsonb('address').notNull(),
  shippingMethod: varchar('shipping_method', { length: 40 }).notNull(),
  shippingFee: integer('shipping_fee').notNull().default(0),
  deliveryDate: varchar('delivery_date', { length: 10 }).notNull(),
  windowStartHour: integer('window_start_hour').notNull(),
  windowEndHour: integer('window_end_hour').notNull(),
  note: varchar('note', { length: 500 }),
  lines: jsonb('lines').notNull(),
  linesHash: varchar('lines_hash', { length: 64 }).notNull(),
  goodsTotal: integer('goods_total').notNull(),
  commissionTotal: integer('commission_total').notNull(),
  prepaymentTotal: integer('prepayment_total').notNull(),
  payableAmount: integer('payable_amount').notNull(),
  orderId: integer('order_id'),
});

export const orders = pgTable(
  'orders',
  {
    id: idColumn(),
    ...timestamps(),
    orderNumber: varchar('order_number', { length: 40 }).notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    sellerId: integer('seller_id').notNull(),
    sellerShopName: varchar('seller_shop_name', { length: 160 }).notNull(),
    checkoutSessionId: integer('checkout_session_id').notNull(),
    status: varchar('status', { length: 30 })
      .notNull()
      .default(OrderStatus.PAID),
    paymentStatus: varchar('payment_status', { length: 30 })
      .notNull()
      .default(OrderPaymentStatus.PAID),
    address: jsonb('address').notNull(),
    shippingMethod: varchar('shipping_method', { length: 40 }).notNull(),
    shippingFee: integer('shipping_fee').notNull(),
    deliveryDate: varchar('delivery_date', { length: 10 }).notNull(),
    windowStartHour: integer('window_start_hour').notNull(),
    windowEndHour: integer('window_end_hour').notNull(),
    note: varchar('note', { length: 500 }),
    goodsTotal: integer('goods_total').notNull(),
    commissionTotal: integer('commission_total').notNull(),
    prepaymentTotal: integer('prepayment_total').notNull(),
    grandTotal: integer('grand_total').notNull(),
  },
  (table) => [
    unique('UQ_orders_order_number').on(table.orderNumber),
    unique('UQ_orders_checkout_session').on(table.checkoutSessionId),
  ],
);

export const orderItems = pgTable('order_items', {
  id: idColumn(),
  ...timestamps(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(),
  productNameFa: varchar('product_name_fa', { length: 255 }).notNull(),
  productNameEn: varchar('product_name_en', { length: 255 }).notNull(),
  imageKey: varchar('image_key', { length: 255 }),
  packQty: integer('pack_qty').notNull(),
  pieceQty: integer('piece_qty').notNull(),
  packMultiple: integer('pack_multiple').notNull(),
  unitPrice: integer('unit_price').notNull(),
  packPrice: integer('pack_price').notNull(),
  commissionPercent: integer('commission_percent').notNull(),
  commissionAmount: integer('commission_amount').notNull(),
  prepaymentAmount: integer('prepayment_amount').notNull(),
  goodsAmount: integer('goods_amount').notNull(),
  lineTotal: integer('line_total').notNull(),
  totalUnits: integer('total_units').notNull(),
});

export type CheckoutSessionRow = typeof checkoutSessions.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
