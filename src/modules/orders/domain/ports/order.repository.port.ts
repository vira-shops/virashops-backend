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

export type ListSellerOrdersFilter = {
  sellerId: number;
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

export type SellerOrderStatusCounts = {
  paid: number;
  processing: number;
  preparing: number;
  shipped: number;
  delivered: number;
  returned: number;
  cancelled: number;
  failed: number;
};

export default interface OrderRepositoryPort {
  findByIdForUser(id: number, userId: number): Promise<Order | null>;
  findByIdForSeller(id: number, sellerId: number): Promise<Order | null>;
  listByUserId(filter: ListOrdersFilter): Promise<OrderPage>;
  listBySellerId(filter: ListSellerOrdersFilter): Promise<OrderPage>;
  countByStatusGroups(userId: number): Promise<OrderStatusCounts>;
  countByStatusForSeller(sellerId: number): Promise<SellerOrderStatusCounts>;
  findByCheckoutSessionId(checkoutSessionId: number): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  nextOrderNumber(): Promise<string>;
}
