import { Inject, Injectable } from '@nestjs/common';
import type OrderRepositoryPort from '../../ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class CountSellerOrderStatusesUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepositoryPort,
  ) {}

  async execute(sellerId: number) {
    return this.orders.countByStatusForSeller(sellerId);
  }
}
