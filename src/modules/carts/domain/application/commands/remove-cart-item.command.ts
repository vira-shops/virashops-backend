export default class RemoveCartItemCommand {
  constructor(
    readonly userId: number,
    readonly itemId: number,
  ) {}
}
