import ProductQuestionKind from '../../model/enums/product-question-kind.enum';

export default class AskProductQuestionCommand {
  constructor(
    readonly userId: number,
    readonly productId: number,
    readonly body: string,
    readonly kind: ProductQuestionKind = ProductQuestionKind.QUESTION,
  ) {}
}
