import { Module } from '@nestjs/common';
import ProductsModule from '../../products/interfaces/products.module';
import SellersModule from '../../sellers/interfaces/sellers.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import ProductQuestionCardPresenter from '../domain/application/services/product-question-card.presenter';
import AnswerProductQuestionUseCase from '../domain/application/usecases/answer-product-question.usecase';
import AskProductQuestionUseCase from '../domain/application/usecases/ask-product-question.usecase';
import ListMyQuestionRepliesUseCase from '../domain/application/usecases/list-my-question-replies.usecase';
import ListMyQuestionsUseCase from '../domain/application/usecases/list-my-questions.usecase';
import ProductQuestionsInfrastructureModule from '../infrastructure/infrastructure.module';
import ProductQuestionsController from './http/controllers/product-questions.controller';
import SellerProductQuestionsController from './http/controllers/seller-product-questions.controller';

@Module({
  imports: [
    ProductQuestionsInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
    ProductsModule,
    SellersModule,
  ],
  controllers: [ProductQuestionsController, SellerProductQuestionsController],
  providers: [
    ProductQuestionCardPresenter,
    AskProductQuestionUseCase,
    AnswerProductQuestionUseCase,
    ListMyQuestionsUseCase,
    ListMyQuestionRepliesUseCase,
  ],
})
export default class ProductQuestionsModule {}
