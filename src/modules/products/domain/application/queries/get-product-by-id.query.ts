export default class GetProductByIdQuery {
  constructor(
    readonly productId: number,
    readonly requireVisible: boolean = true,
  ) {}
}
