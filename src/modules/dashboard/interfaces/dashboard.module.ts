import { Module } from '@nestjs/common';
import NotificationsModule from '../../notifications/interfaces/notifications.module';
import OrdersModule from '../../orders/interfaces/orders.module';
import OrdersInfrastructureModule from '../../orders/infrastructure/infrastructure.module';
import SellersModule from '../../sellers/interfaces/sellers.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import GetBuyerDashboardUseCase from '../domain/application/usecases/get-buyer-dashboard.usecase';
import GetSellerDashboardUseCase from '../domain/application/usecases/get-seller-dashboard.usecase';
import DashboardController from './http/controllers/dashboard.controller';
import SellerDashboardController from './http/controllers/seller-dashboard.controller';

@Module({
  imports: [
    CoreInfrastructureModule,
    UsersModule,
    OrdersModule,
    OrdersInfrastructureModule,
    NotificationsModule,
    SellersModule,
  ],
  controllers: [DashboardController, SellerDashboardController],
  providers: [GetBuyerDashboardUseCase, GetSellerDashboardUseCase],
})
export default class DashboardModule {}
