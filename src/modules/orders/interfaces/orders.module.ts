import { Module } from '@nestjs/common';
import AddressesModule from '../../addresses/interfaces/addresses.module';
import CartsModule from '../../carts/interfaces/carts.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import SellersModule from '../../sellers/interfaces/sellers.module';
import ShippingModule from '../../shipping/interfaces/shipping.module';
import UsersModule from '../../users/interfaces/users.module';
import CountSellerOrderStatusesUseCase from '../domain/application/usecases/count-seller-order-statuses.usecase';
import GetCheckoutSessionUseCase from '../domain/application/usecases/get-checkout-session.usecase';
import GetOrderUseCase from '../domain/application/usecases/get-order.usecase';
import GetPayableCheckoutUseCase from '../domain/application/usecases/get-payable-checkout.usecase';
import GetSellerOrderUseCase from '../domain/application/usecases/get-seller-order.usecase';
import ListOrdersUseCase from '../domain/application/usecases/list-orders.usecase';
import ListSellerOrdersUseCase from '../domain/application/usecases/list-seller-orders.usecase';
import MaterializeOrderFromCheckoutUseCase from '../domain/application/usecases/materialize-order-from-checkout.usecase';
import StartCheckoutUseCase from '../domain/application/usecases/start-checkout.usecase';
import UpdateSellerOrderStatusUseCase from '../domain/application/usecases/update-seller-order-status.usecase';
import OrdersInfrastructureModule from '../infrastructure/infrastructure.module';
import CheckoutController from './http/controllers/checkout.controller';
import OrdersController from './http/controllers/orders.controller';
import SellerOrdersController from './http/controllers/seller-orders.controller';

@Module({
  imports: [
    OrdersInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
    AddressesModule,
    CartsModule,
    ShippingModule,
    SellersModule,
  ],
  controllers: [CheckoutController, OrdersController, SellerOrdersController],
  providers: [
    StartCheckoutUseCase,
    GetCheckoutSessionUseCase,
    GetPayableCheckoutUseCase,
    MaterializeOrderFromCheckoutUseCase,
    ListOrdersUseCase,
    GetOrderUseCase,
    ListSellerOrdersUseCase,
    GetSellerOrderUseCase,
    UpdateSellerOrderStatusUseCase,
    CountSellerOrderStatusesUseCase,
  ],
  exports: [
    GetPayableCheckoutUseCase,
    MaterializeOrderFromCheckoutUseCase,
    GetCheckoutSessionUseCase,
    ListOrdersUseCase,
    ListSellerOrdersUseCase,
    CountSellerOrderStatusesUseCase,
    OrdersInfrastructureModule,
  ],
})
export default class OrdersModule {}
