import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { users } from '../../../../users/infrastructure/drizzle/schema/users';
import ProductQuestionKind from '../../../domain/model/enums/product-question-kind.enum';
import ProductQuestionStatus from '../../../domain/model/enums/product-question-status.enum';

export const productQuestions = pgTable('product_questions', {
  id: idColumn(),
  ...timestamps(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(),
  kind: varchar('kind', { length: 20 })
    .notNull()
    .default(ProductQuestionKind.QUESTION),
  status: varchar('status', { length: 20 })
    .notNull()
    .default(ProductQuestionStatus.NOT_CONFIRMED),
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

export const productRatings = pgTable(
  'product_ratings',
  {
    id: idColumn(),
    ...timestamps(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: integer('product_id').notNull(),
    rating: integer('rating').notNull(),
  },
  (table) => [
    unique('UQ_product_ratings_user_product').on(table.userId, table.productId),
  ],
);

export type ProductQuestionRow = typeof productQuestions.$inferSelect;
export type ProductAnswerRow = typeof productAnswers.$inferSelect;
export type ProductRatingRow = typeof productRatings.$inferSelect;
