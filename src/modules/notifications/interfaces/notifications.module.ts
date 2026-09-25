import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import SellersInfrastructureModule from '../../sellers/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import CreateNotificationUseCase from '../domain/application/usecases/create-notification.usecase';
import CountUnreadNotificationsUseCase from '../domain/application/usecases/count-unread-notifications.usecase';
import GetLatestUnreadNotificationUseCase from '../domain/application/usecases/get-latest-unread-notification.usecase';
import GetNotificationUseCase from '../domain/application/usecases/get-notification.usecase';
import ListNotificationsUseCase from '../domain/application/usecases/list-notifications.usecase';
import MarkAllNotificationsReadUseCase from '../domain/application/usecases/mark-all-notifications-read.usecase';
import MarkNotificationReadUseCase from '../domain/application/usecases/mark-notification-read.usecase';
import NotificationsInfrastructureModule from '../infrastructure/infrastructure.module';
import NotificationsController from './http/controllers/notifications.controller';
import OrderPaidNotificationListener from './listeners/order-paid.notification.listener';

@Module({
  imports: [
    NotificationsInfrastructureModule,
    SellersInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
  ],
  controllers: [NotificationsController],
  providers: [
    CreateNotificationUseCase,
    ListNotificationsUseCase,
    CountUnreadNotificationsUseCase,
    GetNotificationUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    GetLatestUnreadNotificationUseCase,
    OrderPaidNotificationListener,
  ],
  exports: [
    CreateNotificationUseCase,
    CountUnreadNotificationsUseCase,
    GetLatestUnreadNotificationUseCase,
  ],
})
export default class NotificationsModule {}
