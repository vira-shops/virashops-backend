import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  notInArray,
  or,
} from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Product from '../../../domain/model/product.model';
import ProductSort from '../../../domain/model/enums/product-sort.enum';
import ProductStatus from '../../../domain/model/enums/product-status.enum';
import type ProductRepositoryPort from '../../../domain/ports/product.repository.port';
import type {
  ListPublishedProductsFilter,
  PublishedProductPage,
} from '../../../domain/ports/product.repository.port';
import ProductMapper from '../mappers/product.mapper';
import {
  productImages,
  productPriceTiers,
  products,
  type ProductImageRow,
  type ProductPriceTierRow,
  type ProductRow,
} from '../schema/products';

@Injectable()
export default class DrizzleProductRepositoryAdapter implements ProductRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listPublished(
    filter: ListPublishedProductsFilter,
  ): Promise<PublishedProductPage> {
    const where = this.publishedWhere(filter);
    const offset = (filter.page - 1) * filter.limit;
    const orderBy = this.orderBy(filter.sort);

    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(where)
        .orderBy(...orderBy)
        .limit(filter.limit)
        .offset(offset),
      this.db.select({ value: count() }).from(products).where(where),
    ]);

    return {
      items: await this.hydrate(rows),
      total: Number(totals[0]?.value ?? 0),
    };
  }

  async findPublishedBySlug(slug: string): Promise<Product | null> {
    const row = await this.db.query.products.findFirst({
      where: and(
        eq(products.slug, slug),
        isNull(products.deletedAt),
        eq(products.status, ProductStatus.ACTIVE),
        eq(products.published, true),
      ),
    });
    if (!row) {
      return null;
    }
    const [product] = await this.hydrate([row]);
    return product ?? null;
  }

  async findPublishedRelated(
    product: Product,
    limit: number,
  ): Promise<Product[]> {
    const sameCategory = await this.db
      .select()
      .from(products)
      .where(
        and(
          this.publicWhere(),
          eq(products.categoryId, product.getCategory().id),
          ne(products.id, product.getId()),
        ),
      )
      .orderBy(asc(products.sortOrder), asc(products.id))
      .limit(limit);

    const items = [...sameCategory];
    const parentId = product.getCategory().parentId;
    if (items.length < 3 && parentId !== null) {
      const excludeIds = [product.getId(), ...items.map((row) => row.id)];
      const extras = await this.db
        .select()
        .from(products)
        .where(
          and(
            this.publicWhere(),
            or(
              eq(products.categoryId, parentId),
              eq(products.parentCategoryId, parentId),
            ),
            notInArray(products.id, excludeIds),
          ),
        )
        .orderBy(asc(products.sortOrder), asc(products.id))
        .limit(limit - items.length);
      items.push(...extras);
    }

    return this.hydrate(items.slice(0, limit));
  }

  async countPublishedByCategoryIds(
    categoryIds: number[],
  ): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    if (categoryIds.length === 0) {
      return counts;
    }

    const rows = await this.db
      .select({
        categoryId: products.categoryId,
        value: count(),
      })
      .from(products)
      .where(and(this.publicWhere(), inArray(products.categoryId, categoryIds)))
      .groupBy(products.categoryId);

    for (const row of rows) {
      counts.set(row.categoryId, Number(row.value));
    }
    return counts;
  }

  private publicWhere() {
    return and(
      isNull(products.deletedAt),
      eq(products.status, ProductStatus.ACTIVE),
      eq(products.published, true),
    );
  }

  private publishedWhere(filter: ListPublishedProductsFilter) {
    const conditions = [this.publicWhere()];
    if (filter.categoryId !== undefined) {
      conditions.push(eq(products.categoryId, filter.categoryId));
    }
    if (filter.categorySlug) {
      conditions.push(eq(products.categorySlug, filter.categorySlug));
    }
    if (filter.minPrice !== undefined) {
      conditions.push(gte(products.retailPrice, filter.minPrice));
    }
    if (filter.maxPrice !== undefined) {
      conditions.push(lte(products.retailPrice, filter.maxPrice));
    }
    if (filter.query) {
      const pattern = `%${filter.query}%`;
      conditions.push(
        or(
          ilike(products.nameFa, pattern),
          ilike(products.nameEn, pattern),
          ilike(products.slug, pattern),
          ilike(products.brand, pattern),
        ),
      );
    }
    return and(...conditions);
  }

  private orderBy(sort: ProductSort) {
    if (sort === ProductSort.NEWEST) {
      return [desc(products.updatedAt), desc(products.id)];
    }
    if (sort === ProductSort.CHEAPEST) {
      return [asc(products.retailPrice), asc(products.id)];
    }
    return [asc(products.sortOrder), asc(products.id)];
  }

  private async hydrate(rows: ProductRow[]): Promise<Product[]> {
    if (rows.length === 0) {
      return [];
    }
    const ids = rows.map((row) => row.id);
    const [imageRows, tierRows] = await Promise.all([
      this.db
        .select()
        .from(productImages)
        .where(
          and(
            inArray(productImages.productId, ids),
            isNull(productImages.deletedAt),
          ),
        )
        .orderBy(asc(productImages.sortOrder), asc(productImages.id)),
      this.db
        .select()
        .from(productPriceTiers)
        .where(
          and(
            inArray(productPriceTiers.productId, ids),
            isNull(productPriceTiers.deletedAt),
          ),
        )
        .orderBy(asc(productPriceTiers.minQty), asc(productPriceTiers.id)),
    ]);

    const imagesByProduct = new Map<number, ProductImageRow[]>();
    for (const image of imageRows) {
      const list = imagesByProduct.get(image.productId) ?? [];
      list.push(image);
      imagesByProduct.set(image.productId, list);
    }
    const tiersByProduct = new Map<number, ProductPriceTierRow[]>();
    for (const tier of tierRows) {
      const list = tiersByProduct.get(tier.productId) ?? [];
      list.push(tier);
      tiersByProduct.set(tier.productId, list);
    }

    return rows.map((row) =>
      ProductMapper.toDomain(
        row,
        imagesByProduct.get(row.id) ?? [],
        tiersByProduct.get(row.id) ?? [],
      ),
    );
  }
}
