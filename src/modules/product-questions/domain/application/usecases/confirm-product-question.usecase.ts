import { Inject, Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import GetSellerByUserIdQuery from '../../../../sellers/domain/application/queries/get-seller-by-user-id.query';
import GetSellerByUserIdUseCase from '../../../../sellers/domain/application/usecases/get-seller-by-user-id.usecase';
import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import ProductQuestionNotFoundError from '../../errors/product-question-not-found.error';
import ProductQuestion from '../../model/product-question.model';
import type ProductQuestionRepositoryPort from '../../ports/product-question.repository.port';
import { PRODUCT_QUESTION_REPOSITORY } from '../../../shared/tokens/port.token';
import ConfirmProductQuestionCommand from '../commands/confirm-product-question.command';

@Injectable()
export default class ConfirmProductQuestionUseCase {
  constructor(
    @Inject(PRODUCT_QUESTION_REPOSITORY)
    private readonly questions: ProductQuestionRepositoryPort,
    private readonly getProductById: GetProductByIdUseCase,
    private readonly getSellerByUserId: GetSellerByUserIdUseCase,
  ) {}

  async execute(
    command: ConfirmProductQuestionCommand,
  ): Promise<ProductQuestion> {
    const question = await this.questions.findById(command.questionId);
    if (!question) {
      throw new ProductQuestionNotFoundError();
    }

    const product = await this.getProductById.execute(
      new GetProductByIdQuery(question.getProductId(), false),
    );
    await this.assertCanConfirm(command, product.getSeller().id);

    question.confirm();
    return this.questions.save(question);
  }

  private async assertCanConfirm(
    command: ConfirmProductQuestionCommand,
    productSellerId: number,
  ): Promise<void> {
    if (command.actorRoles.includes(Role.ADMIN)) {
      return;
    }

    const isSeller =
      command.actorRoles.includes(Role.RETAIL_SELLER) ||
      command.actorRoles.includes(Role.WHOLESALE_SELLER);
    if (!isSeller) {
      throw new ForbiddenError();
    }

    const seller = await this.getSellerByUserId.execute(
      new GetSellerByUserIdQuery(command.actorUserId),
    );
    if (!seller || seller.id !== productSellerId) {
      throw new ForbiddenError();
    }
  }
}
