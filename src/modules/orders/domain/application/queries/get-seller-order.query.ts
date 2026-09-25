export default class GetSellerOrderQuery {
  constructor(
    readonly sellerId: number,
    readonly orderId: number,
  ) {}
}
