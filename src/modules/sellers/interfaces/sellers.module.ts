import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import GetSellerByUserIdUseCase from '../domain/application/usecases/get-seller-by-user-id.usecase';
import SignupSellerUseCase from '../domain/application/usecases/signup-seller.usecase';
import UpdateSellerStatusUseCase from '../domain/application/usecases/update-seller-status.usecase';
import SellersInfrastructureModule from '../infrastructure/infrastructure.module';
import AdminSellersController from './http/controllers/admin-sellers.controller';
import SellerAuthController from './http/controllers/seller-auth.controller';
import SellerActiveGuard from './http/guards/seller-active.guard';

@Module({
  imports: [SellersInfrastructureModule, UsersModule, CoreInfrastructureModule],
  controllers: [SellerAuthController, AdminSellersController],
  providers: [
    SignupSellerUseCase,
    UpdateSellerStatusUseCase,
    GetSellerByUserIdUseCase,
    SellerActiveGuard,
  ],
  exports: [SellerActiveGuard, GetSellerByUserIdUseCase],
})
export default class SellersModule {}
