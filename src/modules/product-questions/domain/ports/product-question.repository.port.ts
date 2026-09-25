import ProductQuestion from '../model/product-question.model';
import type { ProductAnswerProps } from '../model/product-question.model';

export default interface ProductQuestionRepositoryPort {
  findById(id: number): Promise<ProductQuestion | null>;
  save(question: ProductQuestion): Promise<ProductQuestion>;
  listByUserId(userId: number): Promise<ProductQuestion[]>;
  listRepliesForUser(userId: number): Promise<ProductQuestion[]>;
  countNewReplies(userId: number): Promise<number>;
  saveAnswer(
    answer: Omit<ProductAnswerProps, 'id' | 'createdAt'> & {
      id?: number | null;
    },
  ): Promise<ProductAnswerProps>;
}
