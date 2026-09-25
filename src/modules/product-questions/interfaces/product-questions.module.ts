import { Module } from '@nestjs/common';
import ProductsInfrastructureModule from '../../products/infrastructure/infrastructure.module';
import ProductsModule from '../../products/interfaces/products.module';
import SellersModule from '../../sellers/interfaces/sellers.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import ProductQuestionCardPresenter from '../domain/application/services/product-question-card.presenter';
import AnswerProductQuestionUseCase from '../domain/application/usecases/answer-product-question.usecase';
import AskProductQuestionUseCase from '../domain/application/usecases/ask-product-question.usecase';
import ConfirmProductQuestionUseCase from '../domain/application/usecases/confirm-product-question.usecase';
import GetMyProductRatingUseCase from '../domain/application/usecases/get-my-product-rating.usecase';
import GetProductRatingSummaryUseCase from '../domain/application/usecases/get-product-rating-summary.usecase';
import ListMyQuestionRepliesUseCase from '../domain/application/usecases/list-my-question-replies.usecase';
import ListMyQuestionsUseCase from '../domain/application/usecases/list-my-questions.usecase';
import ListSellerProductQuestionsUseCase from '../domain/application/usecases/list-seller-product-questions.usecase';
import RateProductUseCase from '../domain/application/usecases/rate-product.usecase';
import ProductQuestionsInfrastructureModule from '../infrastructure/infrastructure.module';
import ProductQuestionsController from './http/controllers/product-questions.controller';
import SellerProductQuestionsController from './http/controllers/seller-product-questions.controller';

@Module({
  imports: [
    ProductQuestionsInfrastructureModule,
    ProductsInfrastructureModule,
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
    ConfirmProductQuestionUseCase,
    ListMyQuestionsUseCase,
    ListMyQuestionRepliesUseCase,
    ListSellerProductQuestionsUseCase,
    RateProductUseCase,
    GetMyProductRatingUseCase,
    GetProductRatingSummaryUseCase,
  ],
})
export default class ProductQuestionsModule {}
