import Order from '../model/order.model';

export default interface OrderRepositoryPort {
  findByIdForUser(id: number, userId: number): Promise<Order | null>;
  listByUserId(userId: number): Promise<Order[]>;
  findByCheckoutSessionId(checkoutSessionId: number): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  nextOrderNumber(): Promise<string>;
}
