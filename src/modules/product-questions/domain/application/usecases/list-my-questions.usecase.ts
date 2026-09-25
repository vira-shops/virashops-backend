import { Inject, Injectable } from '@nestjs/common';
import type ProductQuestionRepositoryPort from '../../ports/product-question.repository.port';
import { PRODUCT_QUESTION_REPOSITORY } from '../../../shared/tokens/port.token';
import ListMyQuestionsQuery from '../queries/list-my-questions.query';
import ProductQuestionCardPresenter, {
  type ProductQuestionCardView,
} from '../services/product-question-card.presenter';

@Injectable()
export default class ListMyQuestionsUseCase {
  constructor(
    @Inject(PRODUCT_QUESTION_REPOSITORY)
    private readonly questions: ProductQuestionRepositoryPort,
    private readonly presenter: ProductQuestionCardPresenter,
  ) {}

  async execute(
    query: ListMyQuestionsQuery,
  ): Promise<ProductQuestionCardView[]> {
    const items = await this.questions.listByUserId(query.userId);
    return this.presenter.toCards(items);
  }
}
