import ProductQuestion from '../model/product-question.model';
import type { ProductAnswerProps } from '../model/product-question.model';
import ProductQuestionKind from '../model/enums/product-question-kind.enum';
import ProductQuestionStatus from '../model/enums/product-question-status.enum';

export default interface ProductQuestionRepositoryPort {
  findById(id: number): Promise<ProductQuestion | null>;
  save(question: ProductQuestion): Promise<ProductQuestion>;
  listByUserId(
    userId: number,
    kind?: ProductQuestionKind | null,
  ): Promise<ProductQuestion[]>;
  listByProductIds(
    productIds: number[],
    kind?: ProductQuestionKind | null,
    status?: ProductQuestionStatus | null,
  ): Promise<ProductQuestion[]>;
  listRepliesForUser(userId: number): Promise<ProductQuestion[]>;
  countNewReplies(userId: number): Promise<number>;
  saveAnswer(
    answer: Omit<ProductAnswerProps, 'id' | 'createdAt'> & {
      id?: number | null;
    },
  ): Promise<ProductAnswerProps>;
}
