import { Module } from '@nestjs/common';
import AddressesModule from '../../addresses/interfaces/addresses.module';
import CartsModule from '../../carts/interfaces/carts.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import ShippingMethodRegistry from '../domain/application/services/shipping-method.registry';
import QuoteShippingUseCase from '../domain/application/usecases/quote-shipping.usecase';
import ShippingInfrastructureModule from '../infrastructure/infrastructure.module';
import ShippingController from './http/controllers/shipping.controller';

@Module({
  imports: [
    ShippingInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
    AddressesModule,
    CartsModule,
  ],
  controllers: [ShippingController],
  providers: [ShippingMethodRegistry, QuoteShippingUseCase],
  exports: [QuoteShippingUseCase, ShippingMethodRegistry],
})
export default class ShippingModule {}
