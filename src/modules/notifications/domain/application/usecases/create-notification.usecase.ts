import { Inject, Injectable } from '@nestjs/common';
import Notification from '../../model/notification.model';
import type NotificationRepositoryPort from '../../ports/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from '../../../shared/tokens/port.token';
import CreateNotificationCommand from '../commands/create-notification.command';

@Injectable()
export default class CreateNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepositoryPort,
  ) {}

  async execute(command: CreateNotificationCommand): Promise<Notification> {
    const notification = Notification.create({
      recipientUserId: command.recipientUserId,
      type: command.type,
      title: command.title,
      message: command.message,
      priority: command.priority,
      relatedEntityType: command.relatedEntityType,
      relatedEntityId: command.relatedEntityId,
      metadata: command.metadata,
    });
    return this.notifications.save(notification);
  }
}
