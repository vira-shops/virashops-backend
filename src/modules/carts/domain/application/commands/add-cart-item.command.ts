import CartChannel from '../../model/enums/cart-channel.enum';

export default class AddCartItemCommand {
  constructor(
    readonly userId: number,
    readonly productId: number,
    readonly packQty: number,
    readonly pieceQty: number,
    readonly prepaymentAmount: number | null,
    readonly channel: CartChannel = CartChannel.WHOLESALE,
  ) {}
}
