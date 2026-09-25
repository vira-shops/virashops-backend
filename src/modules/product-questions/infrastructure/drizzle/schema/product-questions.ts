import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';

export const productQuestions = pgTable('product_questions', {
  id: idColumn(),
  ...timestamps(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(),
  body: text('body').notNull(),
});

export const productAnswers = pgTable('product_answers', {
  id: idColumn(),
  ...timestamps(),
  questionId: integer('question_id')
    .notNull()
    .references(() => productQuestions.id, { onDelete: 'cascade' }),
  authorUserId: integer('author_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  body: text('body').notNull(),
  seenByAskerAt: timestamp('seen_by_asker_at', { withTimezone: true }),
});

export type ProductQuestionRow = typeof productQuestions.$inferSelect;
export type ProductAnswerRow = typeof productAnswers.$inferSelect;
