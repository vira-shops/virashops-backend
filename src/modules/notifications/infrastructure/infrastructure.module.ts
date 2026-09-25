import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import { NOTIFICATION_REPOSITORY } from '../shared/tokens/port.token';
import DrizzleNotificationRepositoryAdapter from './drizzle/repositories/notification.repository.adapter';

@Module({
  imports: [CoreInfrastructureModule],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: DrizzleNotificationRepositoryAdapter,
    },
  ],
  exports: [NOTIFICATION_REPOSITORY],
})
export default class NotificationsInfrastructureModule {}
