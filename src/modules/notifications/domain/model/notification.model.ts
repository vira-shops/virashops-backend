import NotificationPriority from './enums/notification-priority.enum';
import NotificationType from './enums/notification-type.enum';

export type NotificationProps = {
  id: number | null;
  recipientUserId: number;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  metadata: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date | null;
};

export default class Notification {
  private constructor(private props: NotificationProps) {}

  static create(
    input: Omit<NotificationProps, 'id' | 'readAt' | 'createdAt'> & {
      id?: number | null;
      readAt?: Date | null;
      createdAt?: Date | null;
    },
  ): Notification {
    return new Notification({
      ...input,
      id: input.id ?? null,
      readAt: input.readAt ?? null,
      createdAt: input.createdAt ?? null,
      title: input.title.trim(),
      message: input.message.trim(),
    });
  }

  static restore(props: NotificationProps): Notification {
    return new Notification(props);
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Notification has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getRecipientUserId(): number {
    return this.props.recipientUserId;
  }

  getType(): NotificationType {
    return this.props.type;
  }

  getTitle(): string {
    return this.props.title;
  }

  getMessage(): string {
    return this.props.message;
  }

  getPriority(): NotificationPriority {
    return this.props.priority;
  }

  getRelatedEntityType(): string | null {
    return this.props.relatedEntityType;
  }

  getRelatedEntityId(): string | null {
    return this.props.relatedEntityId;
  }

  getMetadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  getReadAt(): Date | null {
    return this.props.readAt;
  }

  getCreatedAt(): Date | null {
    return this.props.createdAt;
  }

  isUnread(): boolean {
    return this.props.readAt === null;
  }

  markRead(): void {
    if (!this.props.readAt) {
      this.props.readAt = new Date();
    }
  }

  toSnapshot(): NotificationProps {
    return { ...this.props };
  }
}
