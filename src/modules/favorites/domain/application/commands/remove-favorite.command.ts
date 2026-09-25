export default class RemoveFavoriteCommand {
  constructor(
    readonly userId: number,
    readonly productId: number,
  ) {}
}
