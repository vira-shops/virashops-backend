import Order from '../model/order.model';
import OrderStatus from '../model/enums/order-status.enum';

export type ListOrdersFilter = {
  userId: number;
  fromDate?: string | null;
  toDate?: string | null;
  status?: OrderStatus | null;
  page: number;
  limit: number;
};

export type OrderPage = {
  items: Order[];
  total: number;
};

export type OrderStatusCounts = {
  delivered: number;
  processing: number;
  cancelled: number;
};

export default interface OrderRepositoryPort {
  findByIdForUser(id: number, userId: number): Promise<Order | null>;
  listByUserId(filter: ListOrdersFilter): Promise<OrderPage>;
  countByStatusGroups(userId: number): Promise<OrderStatusCounts>;
  findByCheckoutSessionId(checkoutSessionId: number): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  nextOrderNumber(): Promise<string>;
}
