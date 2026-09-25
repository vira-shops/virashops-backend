import { Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import ProductQuestion from '../../model/product-question.model';

export type ProductQuestionCardView = {
  id: number;
  productId: number;
  productNameFa: string;
  productImageKey: string | null;
  kind: string;
  status: string;
  question: string;
  answers: Array<{ id: number; body: string; createdAt: string | null }>;
  createdAt: string | null;
};

@Injectable()
export default class ProductQuestionCardPresenter {
  constructor(private readonly getProductById: GetProductByIdUseCase) {}

  async toCards(items: ProductQuestion[]): Promise<ProductQuestionCardView[]> {
    const cards: ProductQuestionCardView[] = [];
    for (const question of items) {
      let productNameFa = '';
      let productImageKey: string | null = null;
      try {
        const product = await this.getProductById.execute(
          new GetProductByIdQuery(question.getProductId(), false),
        );
        productNameFa = product.getNameFa();
        productImageKey = product.getPrimaryImageKey();
      } catch {
        productNameFa = `Product #${question.getProductId()}`;
      }
      cards.push({
        id: question.getId(),
        productId: question.getProductId(),
        productNameFa,
        productImageKey,
        kind: question.getKind(),
        status: question.getStatus(),
        question: question.getBody(),
        answers: question.getAnswers().map((answer) => ({
          id: answer.id as number,
          body: answer.body,
          createdAt: answer.createdAt?.toISOString() ?? null,
        })),
        createdAt: question.getCreatedAt()?.toISOString() ?? null,
      });
    }
    return cards;
  }
}
