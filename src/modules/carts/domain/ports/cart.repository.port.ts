import Cart from '../model/cart.model';

export default interface CartRepositoryPort {
  findActiveByUserId(userId: number): Promise<Cart | null>;
  save(cart: Cart): Promise<Cart>;
  deleteItem(cartId: number, itemId: number): Promise<void>;
}
