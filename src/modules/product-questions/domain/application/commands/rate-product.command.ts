export default class RateProductCommand {
  constructor(
    readonly userId: number,
    readonly productId: number,
    readonly rating: number,
  ) {}
}
