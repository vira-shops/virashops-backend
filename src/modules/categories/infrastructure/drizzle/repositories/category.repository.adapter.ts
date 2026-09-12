import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, ilike, isNull, or } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Category from '../../../domain/model/category.model';
import CategoryStatus from '../../../domain/model/enums/category-status.enum';
import CategoryRepositoryPort from '../../../domain/ports/category.repository.port';
import CategoryMapper from '../mappers/category.mapper';
import { categories } from '../schema/categories';

@Injectable()
export default class DrizzleCategoryRepositoryAdapter implements CategoryRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findActiveTree(): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(
        and(
          isNull(categories.deletedAt),
          eq(categories.status, CategoryStatus.ACTIVE),
        ),
      )
      .orderBy(
        asc(categories.depth),
        asc(categories.sortOrder),
        asc(categories.id),
      );
    return rows.map((row) => CategoryMapper.toDomain(row));
  }

  async findById(id: number): Promise<Category | null> {
    const row = await this.db.query.categories.findFirst({
      where: and(eq(categories.id, id), isNull(categories.deletedAt)),
    });
    return row ? CategoryMapper.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.db.query.categories.findFirst({
      where: and(eq(categories.slug, slug), isNull(categories.deletedAt)),
    });
    return row ? CategoryMapper.toDomain(row) : null;
  }

  async searchByName(query: string, limit: number): Promise<Category[]> {
    const pattern = `%${query}%`;
    const rows = await this.db
      .select()
      .from(categories)
      .where(
        and(
          isNull(categories.deletedAt),
          eq(categories.status, CategoryStatus.ACTIVE),
          or(
            ilike(categories.nameFa, pattern),
            ilike(categories.nameEn, pattern),
            ilike(categories.slug, pattern),
          ),
        ),
      )
      .orderBy(
        asc(categories.depth),
        asc(categories.sortOrder),
        asc(categories.id),
      )
      .limit(limit);
    return rows.map((row) => CategoryMapper.toDomain(row));
  }
}
