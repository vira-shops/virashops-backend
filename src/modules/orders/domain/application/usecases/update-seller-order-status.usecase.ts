import { Inject, Injectable } from '@nestjs/common';
import OrderNotFoundError from '../../errors/order-not-found.error';
import type OrderRepositoryPort from '../../ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../../shared/tokens/port.token';
import UpdateSellerOrderStatusCommand from '../commands/update-seller-order-status.command';

@Injectable()
export default class UpdateSellerOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepositoryPort,
  ) {}

  async execute(command: UpdateSellerOrderStatusCommand) {
    const order = await this.orders.findByIdForSeller(
      command.orderId,
      command.sellerId,
    );
    if (!order) {
      throw new OrderNotFoundError();
    }
    order.transitionTo(command.status);
    return this.orders.save(order);
  }
}
