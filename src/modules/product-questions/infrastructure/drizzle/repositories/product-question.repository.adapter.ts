import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, isNull, SQL } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import ProductQuestionKind from '../../../domain/model/enums/product-question-kind.enum';
import ProductQuestionStatus from '../../../domain/model/enums/product-question-status.enum';
import ProductQuestion from '../../../domain/model/product-question.model';
import type { ProductAnswerProps } from '../../../domain/model/product-question.model';
import type ProductQuestionRepositoryPort from '../../../domain/ports/product-question.repository.port';
import ProductQuestionMapper from '../mappers/product-question.mapper';
import { productAnswers, productQuestions } from '../schema/product-questions';

@Injectable()
export default class DrizzleProductQuestionRepositoryAdapter implements ProductQuestionRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: number): Promise<ProductQuestion | null> {
    const row = await this.db.query.productQuestions.findFirst({
      where: and(
        eq(productQuestions.id, id),
        isNull(productQuestions.deletedAt),
      ),
    });
    if (!row) {
      return null;
    }
    const [question] = await this.attachAnswers([row]);
    return question ?? null;
  }

  async save(question: ProductQuestion): Promise<ProductQuestion> {
    const snap = question.toSnapshot();
    if (snap.id === null) {
      const [row] = await this.db
        .insert(productQuestions)
        .values({
          userId: snap.userId,
          productId: snap.productId,
          kind: snap.kind,
          status: snap.status,
          body: snap.body,
        })
        .returning();
      return ProductQuestionMapper.toDomain(row, []);
    }
    const [row] = await this.db
      .update(productQuestions)
      .set({
        kind: snap.kind,
        status: snap.status,
        body: snap.body,
        updatedAt: new Date(),
      })
      .where(eq(productQuestions.id, snap.id))
      .returning();
    const [withAnswers] = await this.attachAnswers([row]);
    return withAnswers ?? ProductQuestionMapper.toDomain(row, []);
  }

  async listByUserId(
    userId: number,
    kind?: ProductQuestionKind | null,
  ): Promise<ProductQuestion[]> {
    const conditions: SQL[] = [
      eq(productQuestions.userId, userId),
      isNull(productQuestions.deletedAt),
    ];
    if (kind) {
      conditions.push(eq(productQuestions.kind, kind));
    }
    const rows = await this.db
      .select()
      .from(productQuestions)
      .where(and(...conditions))
      .orderBy(desc(productQuestions.id));
    return this.attachAnswers(rows);
  }

  async listByProductIds(
    productIds: number[],
    kind?: ProductQuestionKind | null,
    status?: ProductQuestionStatus | null,
  ): Promise<ProductQuestion[]> {
    if (productIds.length === 0) {
      return [];
    }
    const conditions: SQL[] = [
      inArray(productQuestions.productId, productIds),
      isNull(productQuestions.deletedAt),
    ];
    if (kind) {
      conditions.push(eq(productQuestions.kind, kind));
    }
    if (status) {
      conditions.push(eq(productQuestions.status, status));
    }
    const rows = await this.db
      .select()
      .from(productQuestions)
      .where(and(...conditions))
      .orderBy(desc(productQuestions.id));
    return this.attachAnswers(rows);
  }

  async listRepliesForUser(userId: number): Promise<ProductQuestion[]> {
    const answeredQuestionIds = await this.db
      .selectDistinct({ questionId: productAnswers.questionId })
      .from(productAnswers)
      .innerJoin(
        productQuestions,
        eq(productAnswers.questionId, productQuestions.id),
      )
      .where(
        and(
          eq(productQuestions.userId, userId),
          isNull(productQuestions.deletedAt),
          isNull(productAnswers.deletedAt),
        ),
      );
    const ids = answeredQuestionIds.map((row) => row.questionId);
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(productQuestions)
      .where(
        and(
          inArray(productQuestions.id, ids),
          isNull(productQuestions.deletedAt),
        ),
      )
      .orderBy(desc(productQuestions.id));
    return this.attachAnswers(rows);
  }

  async countNewReplies(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(productAnswers)
      .innerJoin(
        productQuestions,
        eq(productAnswers.questionId, productQuestions.id),
      )
      .where(
        and(
          eq(productQuestions.userId, userId),
          isNull(productQuestions.deletedAt),
          isNull(productAnswers.deletedAt),
          isNull(productAnswers.seenByAskerAt),
        ),
      );
    return Number(row?.value ?? 0);
  }

  async saveAnswer(
    answer: Omit<ProductAnswerProps, 'id' | 'createdAt'> & {
      id?: number | null;
    },
  ): Promise<ProductAnswerProps> {
    const [row] = await this.db
      .insert(productAnswers)
      .values({
        questionId: answer.questionId,
        authorUserId: answer.authorUserId,
        body: answer.body.trim(),
      })
      .returning();
    return ProductQuestionMapper.answerToProps(row);
  }

  private async attachAnswers(
    rows: (typeof productQuestions.$inferSelect)[],
  ): Promise<ProductQuestion[]> {
    if (rows.length === 0) {
      return [];
    }
    const ids = rows.map((row) => row.id);
    const answers = await this.db
      .select()
      .from(productAnswers)
      .where(
        and(
          inArray(productAnswers.questionId, ids),
          isNull(productAnswers.deletedAt),
        ),
      )
      .orderBy(asc(productAnswers.id));
    return rows.map((row) =>
      ProductQuestionMapper.toDomain(
        row,
        answers.filter((answer) => answer.questionId === row.id),
      ),
    );
  }
}
