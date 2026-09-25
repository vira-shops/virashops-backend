import Notification from '../../../domain/model/notification.model';
import NotificationPriority from '../../../domain/model/enums/notification-priority.enum';
import NotificationType from '../../../domain/model/enums/notification-type.enum';
import type { NotificationRow } from '../schema/notifications';

export default class NotificationMapper {
  static toDomain(row: NotificationRow): Notification {
    return Notification.restore({
      id: row.id,
      recipientUserId: row.recipientUserId,
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      priority: row.priority as NotificationPriority,
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      readAt: row.readAt,
      createdAt: row.createdAt,
    });
  }
}
