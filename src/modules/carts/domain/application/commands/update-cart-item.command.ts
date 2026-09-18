export default class UpdateCartItemCommand {
  constructor(
    readonly userId: number,
    readonly itemId: number,
    readonly packQty: number,
    readonly pieceQty: number,
    readonly prepaymentAmount: number | null,
  ) {}
}
