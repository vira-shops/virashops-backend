import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Favorite from '../../../domain/model/favorite.model';
import type FavoriteRepositoryPort from '../../../domain/ports/favorite.repository.port';
import FavoriteMapper from '../mappers/favorite.mapper';
import { favorites } from '../schema/favorites';

@Injectable()
export default class DrizzleFavoriteRepositoryAdapter implements FavoriteRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listByUserId(userId: number): Promise<Favorite[]> {
    const rows = await this.db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), isNull(favorites.deletedAt)))
      .orderBy(desc(favorites.id));
    return rows.map((row) => FavoriteMapper.toDomain(row));
  }

  async findByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<Favorite | null> {
    const row = await this.db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, userId),
        eq(favorites.productId, productId),
        isNull(favorites.deletedAt),
      ),
    });
    return row ? FavoriteMapper.toDomain(row) : null;
  }

  async save(favorite: Favorite): Promise<Favorite> {
    const snap = favorite.toSnapshot();
    const existing = await this.db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, snap.userId),
        eq(favorites.productId, snap.productId),
      ),
    });
    if (existing) {
      const [restored] = await this.db
        .update(favorites)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(favorites.id, existing.id))
        .returning();
      return FavoriteMapper.toDomain(restored);
    }
    const [row] = await this.db
      .insert(favorites)
      .values({
        userId: snap.userId,
        productId: snap.productId,
      })
      .returning();
    return FavoriteMapper.toDomain(row);
  }

  async deleteByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<void> {
    await this.db
      .update(favorites)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.productId, productId),
          isNull(favorites.deletedAt),
        ),
      );
  }
}
