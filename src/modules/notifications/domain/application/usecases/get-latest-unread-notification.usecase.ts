import { Inject, Injectable } from '@nestjs/common';
import type NotificationRepositoryPort from '../../ports/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class GetLatestUnreadNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepositoryPort,
  ) {}

  async execute(userId: number) {
    return this.notifications.findLatestUnread(userId);
  }
}
