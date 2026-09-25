import Notification from '../../../domain/model/notification.model';

export default class NotificationHttpMapper {
  static toResponse(notification: Notification) {
    return {
      id: notification.getId(),
      type: notification.getType(),
      title: notification.getTitle(),
      message: notification.getMessage(),
      priority: notification.getPriority(),
      relatedEntityType: notification.getRelatedEntityType(),
      relatedEntityId: notification.getRelatedEntityId(),
      metadata: notification.getMetadata(),
      readAt: notification.getReadAt()?.toISOString() ?? null,
      createdAt: notification.getCreatedAt()?.toISOString() ?? null,
      unread: notification.isUnread(),
    };
  }
}
