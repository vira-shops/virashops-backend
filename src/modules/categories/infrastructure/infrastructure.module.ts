import { Module } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../shared/tokens/port.token';
import DrizzleCategoryRepositoryAdapter from './drizzle/repositories/category.repository.adapter';

@Module({
  providers: [
    {
      provide: CATEGORY_REPOSITORY,
      useClass: DrizzleCategoryRepositoryAdapter,
    },
  ],
  exports: [CATEGORY_REPOSITORY],
})
export default class CategoriesInfrastructureModule {}
