import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import CompleteSellerProfileUseCase from '../domain/application/usecases/complete-seller-profile.usecase';
import CreateSellerWarehouseUseCase from '../domain/application/usecases/create-seller-warehouse.usecase';
import DeleteSellerWarehouseUseCase from '../domain/application/usecases/delete-seller-warehouse.usecase';
import GetRetailSellerProfileUseCase from '../domain/application/usecases/get-retail-seller-profile.usecase';
import GetSellerByUserIdUseCase from '../domain/application/usecases/get-seller-by-user-id.usecase';
import GetSellerProfileUseCase from '../domain/application/usecases/get-seller-profile.usecase';
import UpdateRetailSellerProfileUseCase from '../domain/application/usecases/update-retail-seller-profile.usecase';
import UpdateSellerProfileUseCase from '../domain/application/usecases/update-seller-profile.usecase';
import UpdateSellerStatusUseCase from '../domain/application/usecases/update-seller-status.usecase';
import UpdateSellerWarehouseUseCase from '../domain/application/usecases/update-seller-warehouse.usecase';
import SellersInfrastructureModule from '../infrastructure/infrastructure.module';
import AdminSellersController from './http/controllers/admin-sellers.controller';
import RetailSellerProfileController from './http/controllers/retail-seller-profile.controller';
import SellerAuthController from './http/controllers/seller-auth.controller';
import SellerProfileController from './http/controllers/seller-profile.controller';
import SellerActiveGuard from './http/guards/seller-active.guard';

@Module({
  imports: [SellersInfrastructureModule, UsersModule, CoreInfrastructureModule],
  controllers: [
    SellerAuthController,
    AdminSellersController,
    SellerProfileController,
    RetailSellerProfileController,
  ],
  providers: [
    CompleteSellerProfileUseCase,
    UpdateSellerStatusUseCase,
    GetSellerByUserIdUseCase,
    GetSellerProfileUseCase,
    UpdateSellerProfileUseCase,
    GetRetailSellerProfileUseCase,
    UpdateRetailSellerProfileUseCase,
    CreateSellerWarehouseUseCase,
    UpdateSellerWarehouseUseCase,
    DeleteSellerWarehouseUseCase,
    SellerActiveGuard,
  ],
  exports: [SellerActiveGuard, GetSellerByUserIdUseCase],
})
export default class SellersModule {}
