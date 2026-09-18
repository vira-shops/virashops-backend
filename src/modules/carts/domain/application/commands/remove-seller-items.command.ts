export default class RemoveSellerItemsCommand {
  constructor(
    readonly userId: number,
    readonly sellerId: number,
  ) {}
}
