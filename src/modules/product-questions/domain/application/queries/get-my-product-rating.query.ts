export default class GetMyProductRatingQuery {
  constructor(
    readonly userId: number,
    readonly productId: number,
  ) {}
}
