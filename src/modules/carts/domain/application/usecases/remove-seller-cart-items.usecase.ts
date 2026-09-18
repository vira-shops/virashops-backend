import { Inject, Injectable } from '@nestjs/common';
import type CartRepositoryPort from '../../ports/cart.repository.port';
import { CART_REPOSITORY } from '../../../shared/tokens/port.token';
import RemoveSellerItemsCommand from '../commands/remove-seller-items.command';
import GetOrCreateCartUseCase from './get-or-create-cart.usecase';

@Injectable()
export default class RemoveSellerCartItemsUseCase {
  constructor(
    private readonly getOrCreateCart: GetOrCreateCartUseCase,
    @Inject(CART_REPOSITORY)
    private readonly carts: CartRepositoryPort,
  ) {}

  async execute(command: RemoveSellerItemsCommand): Promise<void> {
    const cart = await this.getOrCreateCart.execute(command.userId);
    cart.removeItemsBySeller(command.sellerId);
    await this.carts.save(cart);
  }
}
