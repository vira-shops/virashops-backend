import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Notification from '../../../domain/model/notification.model';
import type NotificationRepositoryPort from '../../../domain/ports/notification.repository.port';
import type {
  ListNotificationsFilter,
  NotificationPage,
} from '../../../domain/ports/notification.repository.port';
import NotificationMapper from '../mappers/notification.mapper';
import { notifications } from '../schema/notifications';

@Injectable()
export default class DrizzleNotificationRepositoryAdapter implements NotificationRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByIdForUser(
    id: number,
    userId: number,
  ): Promise<Notification | null> {
    const row = await this.db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.recipientUserId, userId),
        isNull(notifications.deletedAt),
      ),
    });
    return row ? NotificationMapper.toDomain(row) : null;
  }

  async listByUserId(
    filter: ListNotificationsFilter,
  ): Promise<NotificationPage> {
    const where = and(
      eq(notifications.recipientUserId, filter.userId),
      isNull(notifications.deletedAt),
    );
    const [totalRow] = await this.db
      .select({ value: count() })
      .from(notifications)
      .where(where);
    const rows = await this.db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.id))
      .limit(filter.limit)
      .offset((filter.page - 1) * filter.limit);
    return {
      items: rows.map((row) => NotificationMapper.toDomain(row)),
      total: Number(totalRow?.value ?? 0),
    };
  }

  async countUnread(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientUserId, userId),
          isNull(notifications.deletedAt),
          isNull(notifications.readAt),
        ),
      );
    return Number(row?.value ?? 0);
  }

  async findLatestUnread(userId: number): Promise<Notification | null> {
    const row = await this.db.query.notifications.findFirst({
      where: and(
        eq(notifications.recipientUserId, userId),
        isNull(notifications.deletedAt),
        isNull(notifications.readAt),
      ),
      orderBy: [desc(notifications.id)],
    });
    return row ? NotificationMapper.toDomain(row) : null;
  }

  async save(notification: Notification): Promise<Notification> {
    const snap = notification.toSnapshot();
    if (snap.id === null) {
      const [row] = await this.db
        .insert(notifications)
        .values({
          recipientUserId: snap.recipientUserId,
          type: snap.type,
          title: snap.title,
          message: snap.message,
          priority: snap.priority,
          relatedEntityType: snap.relatedEntityType,
          relatedEntityId: snap.relatedEntityId,
          metadata: snap.metadata,
          readAt: snap.readAt,
        })
        .returning();
      return NotificationMapper.toDomain(row);
    }
    const [row] = await this.db
      .update(notifications)
      .set({
        readAt: snap.readAt,
        title: snap.title,
        message: snap.message,
        priority: snap.priority,
        metadata: snap.metadata,
      })
      .where(eq(notifications.id, snap.id))
      .returning();
    return NotificationMapper.toDomain(row);
  }

  async markAllRead(userId: number): Promise<number> {
    const result = await this.db
      .update(notifications)
      .set({ readAt: sql`now()` })
      .where(
        and(
          eq(notifications.recipientUserId, userId),
          isNull(notifications.deletedAt),
          isNull(notifications.readAt),
        ),
      )
      .returning({ id: notifications.id });
    return result.length;
  }
}
