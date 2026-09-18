import { Inject, Injectable } from '@nestjs/common';
import OrderNotFoundError from '../../errors/order-not-found.error';
import type OrderRepositoryPort from '../../ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../../shared/tokens/port.token';
import GetOrderQuery from '../queries/get-order.query';

@Injectable()
export default class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepositoryPort,
  ) {}

  async execute(query: GetOrderQuery) {
    const order = await this.orders.findByIdForUser(
      query.orderId,
      query.userId,
    );
    if (!order) {
      throw new OrderNotFoundError();
    }
    return order;
  }
}
