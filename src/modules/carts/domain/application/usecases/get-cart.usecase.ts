import { Injectable } from '@nestjs/common';
import CartViewFactory from '../services/cart-view.factory';
import GetCartQuery from '../queries/get-cart.query';
import GetOrCreateCartUseCase from './get-or-create-cart.usecase';
import type { CartView } from '../../view-models/cart-invoice.view';

@Injectable()
export default class GetCartUseCase {
  constructor(private readonly getOrCreateCart: GetOrCreateCartUseCase) {}

  async execute(query: GetCartQuery): Promise<CartView> {
    const cart = await this.getOrCreateCart.execute(query.userId);
    return CartViewFactory.toView(cart);
  }
}
