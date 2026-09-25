import Notification from '../model/notification.model';

export type ListNotificationsFilter = {
  userId: number;
  page: number;
  limit: number;
};

export type NotificationPage = {
  items: Notification[];
  total: number;
};

export default interface NotificationRepositoryPort {
  findByIdForUser(id: number, userId: number): Promise<Notification | null>;
  listByUserId(filter: ListNotificationsFilter): Promise<NotificationPage>;
  countUnread(userId: number): Promise<number>;
  findLatestUnread(userId: number): Promise<Notification | null>;
  save(notification: Notification): Promise<Notification>;
  markAllRead(userId: number): Promise<number>;
}
