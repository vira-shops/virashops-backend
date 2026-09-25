import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';
import NotificationPriority from '../../../domain/model/enums/notification-priority.enum';
import NotificationType from '../../../domain/model/enums/notification-type.enum';

export const notifications = pgTable('notifications', {
  id: idColumn(),
  ...timestamps(),
  recipientUserId: integer('recipient_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 })
    .notNull()
    .default(NotificationType.SYSTEM),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  priority: varchar('priority', { length: 20 })
    .notNull()
    .default(NotificationPriority.NORMAL),
  relatedEntityType: varchar('related_entity_type', { length: 60 }),
  relatedEntityId: varchar('related_entity_id', { length: 60 }),
  metadata: jsonb('metadata'),
  readAt: timestamp('read_at', { withTimezone: true }),
});

export type NotificationRow = typeof notifications.$inferSelect;
