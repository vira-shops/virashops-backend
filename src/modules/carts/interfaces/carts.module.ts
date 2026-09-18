import { Module } from '@nestjs/common';
import ProductsModule from '../../products/interfaces/products.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import CartPricingService from '../domain/application/services/cart-pricing.service';
import AddCartItemUseCase from '../domain/application/usecases/add-cart-item.usecase';
import ClearCartUseCase from '../domain/application/usecases/clear-cart.usecase';
import GetCartUseCase from '../domain/application/usecases/get-cart.usecase';
import GetOrCreateCartUseCase from '../domain/application/usecases/get-or-create-cart.usecase';
import GetSellerCartLinesUseCase from '../domain/application/usecases/get-seller-cart-lines.usecase';
import RemoveCartItemUseCase from '../domain/application/usecases/remove-cart-item.usecase';
import RemoveSellerCartItemsUseCase from '../domain/application/usecases/remove-seller-cart-items.usecase';
import UpdateCartItemUseCase from '../domain/application/usecases/update-cart-item.usecase';
import CartsInfrastructureModule from '../infrastructure/infrastructure.module';
import CartsController from './http/controllers/carts.controller';

@Module({
  imports: [
    CartsInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
    ProductsModule,
  ],
  controllers: [CartsController],
  providers: [
    CartPricingService,
    GetOrCreateCartUseCase,
    GetCartUseCase,
    AddCartItemUseCase,
    UpdateCartItemUseCase,
    RemoveCartItemUseCase,
    ClearCartUseCase,
    RemoveSellerCartItemsUseCase,
    GetSellerCartLinesUseCase,
  ],
  exports: [
    GetOrCreateCartUseCase,
    GetSellerCartLinesUseCase,
    RemoveSellerCartItemsUseCase,
    GetCartUseCase,
  ],
})
export default class CartsModule {}
