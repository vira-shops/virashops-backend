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
    return this.orders.listByUserId(query.userId);
  }
}
