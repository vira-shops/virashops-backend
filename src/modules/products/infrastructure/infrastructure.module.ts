import { Module } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../shared/tokens/port.token';
import DrizzleProductRepositoryAdapter from './drizzle/repositories/product.repository.adapter';

@Module({
  providers: [
    {
      provide: PRODUCT_REPOSITORY,
      useClass: DrizzleProductRepositoryAdapter,
    },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export default class ProductsInfrastructureModule {}
