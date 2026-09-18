import { Module } from '@nestjs/common';
import {
  CHECKOUT_SESSION_REPOSITORY,
  ORDER_REPOSITORY,
} from '../shared/tokens/port.token';
import DrizzleCheckoutSessionRepositoryAdapter from './drizzle/repositories/checkout-session.repository.adapter';
import DrizzleOrderRepositoryAdapter from './drizzle/repositories/order.repository.adapter';

@Module({
  providers: [
    {
      provide: CHECKOUT_SESSION_REPOSITORY,
      useClass: DrizzleCheckoutSessionRepositoryAdapter,
    },
    {
      provide: ORDER_REPOSITORY,
      useClass: DrizzleOrderRepositoryAdapter,
    },
  ],
  exports: [CHECKOUT_SESSION_REPOSITORY, ORDER_REPOSITORY],
})
export default class OrdersInfrastructureModule {}
