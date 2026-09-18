import { Injectable } from '@nestjs/common';
import CartEmptyError from '../../errors/cart-empty.error';
import CartItem from '../../model/cart-item.model';
import GetOrCreateCartUseCase from './get-or-create-cart.usecase';

@Injectable()
export default class GetSellerCartLinesUseCase {
  constructor(private readonly getOrCreateCart: GetOrCreateCartUseCase) {}

  async execute(userId: number, sellerId: number): Promise<CartItem[]> {
    const cart = await this.getOrCreateCart.execute(userId);
    const items = cart.itemsForSeller(sellerId);
    if (items.length === 0) {
      throw new CartEmptyError();
    }
    return items;
  }
}
