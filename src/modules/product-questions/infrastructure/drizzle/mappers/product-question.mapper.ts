import ProductQuestion from '../../../domain/model/product-question.model';
import type { ProductAnswerProps } from '../../../domain/model/product-question.model';
import ProductQuestionKind from '../../../domain/model/enums/product-question-kind.enum';
import ProductQuestionStatus from '../../../domain/model/enums/product-question-status.enum';
import type {
  ProductAnswerRow,
  ProductQuestionRow,
} from '../schema/product-questions';

export default class ProductQuestionMapper {
  static toDomain(
    question: ProductQuestionRow,
    answers: ProductAnswerRow[],
  ): ProductQuestion {
    return ProductQuestion.restore({
      id: question.id,
      userId: question.userId,
      productId: question.productId,
      kind: question.kind as ProductQuestionKind,
      status: question.status as ProductQuestionStatus,
      body: question.body,
      createdAt: question.createdAt,
      answers: answers.map((answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        authorUserId: answer.authorUserId,
        body: answer.body,
        createdAt: answer.createdAt,
      })),
    });
  }

  static answerToProps(row: ProductAnswerRow): ProductAnswerProps {
    return {
      id: row.id,
      questionId: row.questionId,
      authorUserId: row.authorUserId,
      body: row.body,
      createdAt: row.createdAt,
    };
  }
}
