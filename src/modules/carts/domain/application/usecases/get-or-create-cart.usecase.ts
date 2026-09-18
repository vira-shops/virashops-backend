import { Inject, Injectable } from '@nestjs/common';
import Cart from '../../model/cart.model';
import CartChannel from '../../model/enums/cart-channel.enum';
import type CartRepositoryPort from '../../ports/cart.repository.port';
import { CART_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class GetOrCreateCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly carts: CartRepositoryPort,
  ) {}

  async execute(
    userId: number,
    channel: CartChannel = CartChannel.WHOLESALE,
  ): Promise<Cart> {
    const existing = await this.carts.findActiveByUserId(userId);
    if (existing) {
      return existing;
    }
    return this.carts.save(Cart.create(userId, channel));
  }
}
