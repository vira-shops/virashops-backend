export default class AddFavoriteCommand {
  constructor(
    readonly userId: number,
    readonly productId: number,
  ) {}
}
