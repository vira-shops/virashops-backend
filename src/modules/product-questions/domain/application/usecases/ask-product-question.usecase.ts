import { Inject, Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import ProductQuestion from '../../model/product-question.model';
import type ProductQuestionRepositoryPort from '../../ports/product-question.repository.port';
import { PRODUCT_QUESTION_REPOSITORY } from '../../../shared/tokens/port.token';
import AskProductQuestionCommand from '../commands/ask-product-question.command';

@Injectable()
export default class AskProductQuestionUseCase {
  constructor(
    @Inject(PRODUCT_QUESTION_REPOSITORY)
    private readonly questions: ProductQuestionRepositoryPort,
    private readonly getProductById: GetProductByIdUseCase,
  ) {}

  async execute(command: AskProductQuestionCommand): Promise<ProductQuestion> {
    await this.getProductById.execute(
      new GetProductByIdQuery(command.productId, true),
    );
    return this.questions.save(
      ProductQuestion.create(
        command.userId,
        command.productId,
        command.body,
        command.kind,
      ),
    );
  }
}
