import { Inject, Injectable } from '@nestjs/common';
import type NotificationRepositoryPort from '../../ports/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class MarkAllNotificationsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepositoryPort,
  ) {}

  async execute(userId: number): Promise<{ updated: number }> {
    const updated = await this.notifications.markAllRead(userId);
    return { updated };
  }
}
