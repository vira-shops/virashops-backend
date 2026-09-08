import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  unique,
  varchar,
  timestamp,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import AccountStatus from '../../../domain/model/enums/account-status.enum';

export const users = pgTable(
  'users',
  {
    id: idColumn(),
    ...timestamps(),
    phone: varchar('phone', { length: 11 }).notNull(),
    firstName: varchar('first_name', { length: 80 }).notNull(),
    lastName: varchar('last_name', { length: 80 }).notNull(),
    status: varchar('status', { length: 20 })
      .notNull()
      .default(AccountStatus.ACTIVE),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    activityType: varchar('activity_type', { length: 80 }),
    guildType: varchar('guild_type', { length: 80 }),
  },
  (table) => [unique('UQ_users_phone').on(table.phone)],
);

export const userRoles = pgTable(
  'user_roles',
  {
    id: idColumn(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 32 }).notNull(),
  },
  (table) => [
    unique('UQ_user_roles_user_id_role').on(table.userId, table.role),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

export type UserRow = typeof users.$inferSelect;
export type UserRoleRow = typeof userRoles.$inferSelect;
export type UserWithRoles = UserRow & { roles: UserRoleRow[] };
