import { Inject, Injectable } from '@nestjs/common';
import type NotificationRepositoryPort from '../../ports/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class CountUnreadNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepositoryPort,
  ) {}

  async execute(userId: number): Promise<number> {
    return this.notifications.countUnread(userId);
  }
}
