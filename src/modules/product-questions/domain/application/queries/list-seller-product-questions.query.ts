import ProductQuestionKind from '../../model/enums/product-question-kind.enum';
import ProductQuestionStatus from '../../model/enums/product-question-status.enum';

export default class ListSellerProductQuestionsQuery {
  constructor(
    readonly sellerId: number,
    readonly kind: ProductQuestionKind | null = null,
    readonly status: ProductQuestionStatus | null = null,
  ) {}
}
