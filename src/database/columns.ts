import { serial, timestamp } from 'drizzle-orm/pg-core';

export function idColumn() {
  return serial('id').primaryKey();
}

export function timestamps() {
  return {
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  };
}
