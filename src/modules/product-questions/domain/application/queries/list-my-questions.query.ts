import ProductQuestionKind from '../../model/enums/product-question-kind.enum';

export default class ListMyQuestionsQuery {
  constructor(
    readonly userId: number,
    readonly kind: ProductQuestionKind | null = null,
  ) {}
}
