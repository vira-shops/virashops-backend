import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import { PRODUCT_QUESTION_REPOSITORY } from '../shared/tokens/port.token';
import DrizzleProductQuestionRepositoryAdapter from './drizzle/repositories/product-question.repository.adapter';

@Module({
  imports: [CoreInfrastructureModule],
  providers: [
    {
      provide: PRODUCT_QUESTION_REPOSITORY,
      useClass: DrizzleProductQuestionRepositoryAdapter,
    },
  ],
  exports: [PRODUCT_QUESTION_REPOSITORY],
})
export default class ProductQuestionsInfrastructureModule {}
