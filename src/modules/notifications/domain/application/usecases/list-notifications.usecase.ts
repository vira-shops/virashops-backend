import { Inject, Injectable } from '@nestjs/common';
import type NotificationRepositoryPort from '../../ports/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from '../../../shared/tokens/port.token';
import ListNotificationsQuery from '../queries/list-notifications.query';

@Injectable()
export default class ListNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepositoryPort,
  ) {}

  async execute(query: ListNotificationsQuery) {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    return this.notifications.listByUserId({
      userId: query.userId,
      page,
      limit,
    });
  }
}
