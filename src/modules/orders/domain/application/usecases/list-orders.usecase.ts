import { Inject, Injectable } from '@nestjs/common';
import type OrderRepositoryPort from '../../ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../../shared/tokens/port.token';
import ListOrdersQuery from '../queries/list-orders.query';

@Injectable()
export default class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepositoryPort,
  ) {}

  async execute(query: ListOrdersQuery) {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    return this.orders.listByUserId({
      userId: query.userId,
      fromDate: query.fromDate,
      toDate: query.toDate,
      status: query.status,
      page,
      limit,
    });
  }
}
