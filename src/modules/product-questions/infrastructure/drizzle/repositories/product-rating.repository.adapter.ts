import { Inject, Injectable } from '@nestjs/common';
import { and, avg, count, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import ProductRating from '../../../domain/model/product-rating.model';
import type ProductRatingRepositoryPort from '../../../domain/ports/product-rating.repository.port';
import type { ProductRatingSummary } from '../../../domain/ports/product-rating.repository.port';
import { productRatings } from '../schema/product-questions';

@Injectable()
export default class DrizzleProductRatingRepositoryAdapter implements ProductRatingRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<ProductRating | null> {
    const row = await this.db.query.productRatings.findFirst({
      where: and(
        eq(productRatings.userId, userId),
        eq(productRatings.productId, productId),
        isNull(productRatings.deletedAt),
      ),
    });
    if (!row) {
      return null;
    }
    return ProductRating.restore({
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      rating: row.rating,
      createdAt: row.createdAt,
    });
  }

  async upsert(rating: ProductRating): Promise<ProductRating> {
    const snap = rating.toSnapshot();
    const existing = await this.db.query.productRatings.findFirst({
      where: and(
        eq(productRatings.userId, snap.userId),
        eq(productRatings.productId, snap.productId),
      ),
    });
    if (existing) {
      const [row] = await this.db
        .update(productRatings)
        .set({ rating: snap.rating, updatedAt: new Date(), deletedAt: null })
        .where(eq(productRatings.id, existing.id))
        .returning();
      return ProductRating.restore({
        id: row.id,
        userId: row.userId,
        productId: row.productId,
        rating: row.rating,
        createdAt: row.createdAt,
      });
    }
    const [row] = await this.db
      .insert(productRatings)
      .values({
        userId: snap.userId,
        productId: snap.productId,
        rating: snap.rating,
      })
      .returning();
    return ProductRating.restore({
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      rating: row.rating,
      createdAt: row.createdAt,
    });
  }

  async summarizeForProduct(productId: number): Promise<ProductRatingSummary> {
    const [row] = await this.db
      .select({
        average: avg(productRatings.rating),
        count: count(),
      })
      .from(productRatings)
      .where(
        and(
          eq(productRatings.productId, productId),
          isNull(productRatings.deletedAt),
        ),
      );
    const countValue = Number(row?.count ?? 0);
    const averageValue =
      countValue === 0 ? 0 : Number(Number(row?.average ?? 0).toFixed(2));
    return { average: averageValue, count: countValue };
  }
}
