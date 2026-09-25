import { Inject, Injectable } from '@nestjs/common';
import NotificationNotFoundError from '../../errors/notification-not-found.error';
import type NotificationRepositoryPort from '../../ports/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class MarkNotificationReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepositoryPort,
  ) {}

  async execute(id: number, userId: number) {
    const notification = await this.notifications.findByIdForUser(id, userId);
    if (!notification) {
      throw new NotificationNotFoundError();
    }
    notification.markRead();
    return this.notifications.save(notification);
  }
}
