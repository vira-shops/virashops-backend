export default class GetOrderQuery {
  constructor(
    readonly userId: number,
    readonly orderId: number,
  ) {}
}
