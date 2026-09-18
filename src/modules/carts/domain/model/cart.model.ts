import CartItem from './cart-item.model';
import CartChannel from './enums/cart-channel.enum';
import CartItemNotFoundError from '../errors/cart-item-not-found.error';

export type CartProps = {
  id: number | null;
  userId: number;
  channel: CartChannel;
  items: CartItem[];
};

export default class Cart {
  private constructor(private props: CartProps) {}

  static create(
    userId: number,
    channel: CartChannel = CartChannel.WHOLESALE,
  ): Cart {
    return new Cart({ id: null, userId, channel, items: [] });
  }

  static restore(props: CartProps): Cart {
    return new Cart(props);
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Cart has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getChannel(): CartChannel {
    return this.props.channel;
  }

  getItems(): CartItem[] {
    return [...this.props.items];
  }

  findItemByProductId(productId: number): CartItem | undefined {
    return this.props.items.find((item) => item.getProductId() === productId);
  }

  findItemById(itemId: number): CartItem | undefined {
    return this.props.items.find(
      (item) => item.hasId() && item.getId() === itemId,
    );
  }

  upsertItem(item: CartItem): void {
    const existing = this.findItemByProductId(item.getProductId());
    if (existing) {
      existing.mergeQuantities(item.getPackQty(), item.getPieceQty());
      return;
    }
    this.props.items.push(item);
  }

  replaceItem(item: CartItem): void {
    const index = this.props.items.findIndex(
      (current) => current.getProductId() === item.getProductId(),
    );
    if (index >= 0) {
      this.props.items[index] = item;
      return;
    }
    this.props.items.push(item);
  }

  updateItemQuantities(
    itemId: number,
    packQty: number,
    pieceQty: number,
  ): void {
    const item = this.findItemById(itemId);
    if (!item) {
      throw new CartItemNotFoundError();
    }
    item.updateQuantities(packQty, pieceQty);
  }

  updateItemPrepayment(itemId: number, prepaymentAmount: number): void {
    const item = this.findItemById(itemId);
    if (!item) {
      throw new CartItemNotFoundError();
    }
    item.updatePrepayment(prepaymentAmount);
  }

  removeItem(itemId: number): void {
    const before = this.props.items.length;
    this.props.items = this.props.items.filter(
      (item) => !(item.hasId() && item.getId() === itemId),
    );
    if (this.props.items.length === before) {
      throw new CartItemNotFoundError();
    }
  }

  removeItemsBySeller(sellerId: number): void {
    this.props.items = this.props.items.filter(
      (item) => item.getSellerId() !== sellerId,
    );
  }

  clear(): void {
    this.props.items = [];
  }

  itemsForSeller(sellerId: number): CartItem[] {
    return this.props.items.filter((item) => item.getSellerId() === sellerId);
  }

  goodsTotal(): number {
    return this.props.items.reduce((sum, item) => sum + item.goodsAmount(), 0);
  }

  commissionTotal(): number {
    return this.props.items.reduce(
      (sum, item) => sum + item.commissionAmount(),
      0,
    );
  }

  prepaymentTotal(): number {
    return this.props.items.reduce(
      (sum, item) => sum + item.getPrepaymentAmount(),
      0,
    );
  }

  grandTotal(): number {
    return this.props.items.reduce((sum, item) => sum + item.lineTotal(), 0);
  }

  toSnapshot(): CartProps {
    return {
      id: this.props.id,
      userId: this.props.userId,
      channel: this.props.channel,
      items: this.props.items.map((item) =>
        CartItem.restore(item.toSnapshot()),
      ),
    };
  }
}
