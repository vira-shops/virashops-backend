import { Inject, Injectable } from '@nestjs/common';
import type ProductRepositoryPort from '../../../../products/domain/ports/product.repository.port';
import { PRODUCT_REPOSITORY } from '../../../../products/shared/tokens/port.token';
import type ProductQuestionRepositoryPort from '../../ports/product-question.repository.port';
import { PRODUCT_QUESTION_REPOSITORY } from '../../../shared/tokens/port.token';
import ListSellerProductQuestionsQuery from '../queries/list-seller-product-questions.query';
import ProductQuestionCardPresenter, {
  type ProductQuestionCardView,
} from '../services/product-question-card.presenter';

@Injectable()
export default class ListSellerProductQuestionsUseCase {
  constructor(
    @Inject(PRODUCT_QUESTION_REPOSITORY)
    private readonly questions: ProductQuestionRepositoryPort,
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
    private readonly presenter: ProductQuestionCardPresenter,
  ) {}

  async execute(
    query: ListSellerProductQuestionsQuery,
  ): Promise<ProductQuestionCardView[]> {
    const productIds = await this.products.listIdsBySellerId(query.sellerId);
    const items = await this.questions.listByProductIds(
      productIds,
      query.kind,
      query.status,
    );
    return this.presenter.toCards(items);
  }
}
