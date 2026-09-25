import { Inject, Injectable } from '@nestjs/common';
import OrderNotFoundError from '../../errors/order-not-found.error';
import type OrderRepositoryPort from '../../ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../../shared/tokens/port.token';
import GetSellerOrderQuery from '../queries/get-seller-order.query';

@Injectable()
export default class GetSellerOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepositoryPort,
  ) {}

  async execute(query: GetSellerOrderQuery) {
    const order = await this.orders.findByIdForSeller(
      query.orderId,
      query.sellerId,
    );
    if (!order) {
      throw new OrderNotFoundError();
    }
    return order;
  }
}
