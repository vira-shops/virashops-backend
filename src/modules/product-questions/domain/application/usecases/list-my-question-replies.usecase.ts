import { Inject, Injectable } from '@nestjs/common';
import type ProductQuestionRepositoryPort from '../../ports/product-question.repository.port';
import { PRODUCT_QUESTION_REPOSITORY } from '../../../shared/tokens/port.token';
import ListMyQuestionRepliesQuery from '../queries/list-my-question-replies.query';
import ProductQuestionCardPresenter, {
  type ProductQuestionCardView,
} from '../services/product-question-card.presenter';

@Injectable()
export default class ListMyQuestionRepliesUseCase {
  constructor(
    @Inject(PRODUCT_QUESTION_REPOSITORY)
    private readonly questions: ProductQuestionRepositoryPort,
    private readonly presenter: ProductQuestionCardPresenter,
  ) {}

  async execute(
    query: ListMyQuestionRepliesQuery,
  ): Promise<{ items: ProductQuestionCardView[]; newRepliesCount: number }> {
    const items = await this.questions.listRepliesForUser(query.userId);
    const cards = await this.presenter.toCards(items);
    const newRepliesCount = await this.questions.countNewReplies(query.userId);
    return { items: cards, newRepliesCount };
  }
}
