import { Module } from '@nestjs/common';
import NotificationsModule from '../../notifications/interfaces/notifications.module';
import OrdersModule from '../../orders/interfaces/orders.module';
import OrdersInfrastructureModule from '../../orders/infrastructure/infrastructure.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import GetBuyerDashboardUseCase from '../domain/application/usecases/get-buyer-dashboard.usecase';
import DashboardController from './http/controllers/dashboard.controller';

@Module({
  imports: [
    CoreInfrastructureModule,
    UsersModule,
    OrdersModule,
    OrdersInfrastructureModule,
    NotificationsModule,
  ],
  controllers: [DashboardController],
  providers: [GetBuyerDashboardUseCase],
})
export default class DashboardModule {}
