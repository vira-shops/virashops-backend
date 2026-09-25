export const ORDER_PAID_EVENT = 'orders.order-paid';

export type OrderPaidEvent = {
  userId: number;
  sellerId: number;
  orderId: number;
  orderNumber: string;
};
