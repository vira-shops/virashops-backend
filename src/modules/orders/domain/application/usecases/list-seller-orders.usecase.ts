import { Inject, Injectable } from '@nestjs/common';
import type OrderRepositoryPort from '../../ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../../shared/tokens/port.token';
import ListSellerOrdersQuery from '../queries/list-seller-orders.query';

@Injectable()
export default class ListSellerOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepositoryPort,
  ) {}

  async execute(query: ListSellerOrdersQuery) {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    return this.orders.listBySellerId({
      sellerId: query.sellerId,
      fromDate: query.fromDate,
      toDate: query.toDate,
      status: query.status,
      page,
      limit,
    });
  }
}
