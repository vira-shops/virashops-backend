import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import {
  PRODUCT_QUESTION_REPOSITORY,
  PRODUCT_RATING_REPOSITORY,
} from '../shared/tokens/port.token';
import DrizzleProductQuestionRepositoryAdapter from './drizzle/repositories/product-question.repository.adapter';
import DrizzleProductRatingRepositoryAdapter from './drizzle/repositories/product-rating.repository.adapter';

@Module({
  imports: [CoreInfrastructureModule],
  providers: [
    {
      provide: PRODUCT_QUESTION_REPOSITORY,
      useClass: DrizzleProductQuestionRepositoryAdapter,
    },
    {
      provide: PRODUCT_RATING_REPOSITORY,
      useClass: DrizzleProductRatingRepositoryAdapter,
    },
  ],
  exports: [PRODUCT_QUESTION_REPOSITORY, PRODUCT_RATING_REPOSITORY],
})
export default class ProductQuestionsInfrastructureModule {}
