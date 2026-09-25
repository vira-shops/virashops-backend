export default class AskProductQuestionCommand {
  constructor(
    readonly userId: number,
    readonly productId: number,
    readonly body: string,
  ) {}
}
