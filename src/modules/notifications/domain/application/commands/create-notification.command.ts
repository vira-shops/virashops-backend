import NotificationPriority from '../../model/enums/notification-priority.enum';
import NotificationType from '../../model/enums/notification-type.enum';

export default class CreateNotificationCommand {
  constructor(
    readonly recipientUserId: number,
    readonly type: NotificationType,
    readonly title: string,
    readonly message: string,
    readonly priority: NotificationPriority = NotificationPriority.NORMAL,
    readonly relatedEntityType: string | null = null,
    readonly relatedEntityId: string | null = null,
    readonly metadata: Record<string, unknown> | null = null,
  ) {}
}
