import { Module } from '@nestjs/common';
import AddressesModule from '../../addresses/interfaces/addresses.module';
import CartsModule from '../../carts/interfaces/carts.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import ShippingModule from '../../shipping/interfaces/shipping.module';
import UsersModule from '../../users/interfaces/users.module';
import GetCheckoutSessionUseCase from '../domain/application/usecases/get-checkout-session.usecase';
import GetOrderUseCase from '../domain/application/usecases/get-order.usecase';
import GetPayableCheckoutUseCase from '../domain/application/usecases/get-payable-checkout.usecase';
import ListOrdersUseCase from '../domain/application/usecases/list-orders.usecase';
import MaterializeOrderFromCheckoutUseCase from '../domain/application/usecases/materialize-order-from-checkout.usecase';
import StartCheckoutUseCase from '../domain/application/usecases/start-checkout.usecase';
import OrdersInfrastructureModule from '../infrastructure/infrastructure.module';
import CheckoutController from './http/controllers/checkout.controller';
import OrdersController from './http/controllers/orders.controller';

@Module({
  imports: [
    OrdersInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
    AddressesModule,
    CartsModule,
    ShippingModule,
  ],
  controllers: [CheckoutController, OrdersController],
  providers: [
    StartCheckoutUseCase,
    GetCheckoutSessionUseCase,
    GetPayableCheckoutUseCase,
    MaterializeOrderFromCheckoutUseCase,
    ListOrdersUseCase,
    GetOrderUseCase,
  ],
  exports: [
    GetPayableCheckoutUseCase,
    MaterializeOrderFromCheckoutUseCase,
    GetCheckoutSessionUseCase,
  ],
})
export default class OrdersModule {}
