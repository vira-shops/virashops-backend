import { Module } from '@nestjs/common';
import { CART_REPOSITORY } from '../shared/tokens/port.token';
import DrizzleCartRepositoryAdapter from './drizzle/repositories/cart.repository.adapter';

@Module({
  providers: [
    {
      provide: CART_REPOSITORY,
      useClass: DrizzleCartRepositoryAdapter,
    },
  ],
  exports: [CART_REPOSITORY],
})
export default class CartsInfrastructureModule {}
