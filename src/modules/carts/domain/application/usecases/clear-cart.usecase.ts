import { Inject, Injectable } from '@nestjs/common';
import type CartRepositoryPort from '../../ports/cart.repository.port';
import { CART_REPOSITORY } from '../../../shared/tokens/port.token';
import CartViewFactory from '../services/cart-view.factory';
import ClearCartCommand from '../commands/clear-cart.command';
import GetOrCreateCartUseCase from './get-or-create-cart.usecase';
import type { CartView } from '../../view-models/cart-invoice.view';

@Injectable()
export default class ClearCartUseCase {
  constructor(
    private readonly getOrCreateCart: GetOrCreateCartUseCase,
    @Inject(CART_REPOSITORY)
    private readonly carts: CartRepositoryPort,
  ) {}

  async execute(command: ClearCartCommand): Promise<CartView> {
    const cart = await this.getOrCreateCart.execute(command.userId);
    cart.clear();
    const saved = await this.carts.save(cart);
    return CartViewFactory.toView(saved);
  }
}
