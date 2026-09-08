import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from '../../../../../database/columns';
import { categories } from '../../../../categories/infrastructure/drizzle/schema/categories';
import { sellers } from '../../../../sellers/infrastructure/drizzle/schema/sellers';
import ProductStatus from '../../../domain/model/enums/product-status.enum';
import type { ProductSpecProps } from '../../../domain/model/product.types';

export const products = pgTable(
  'products',
  {
    id: idColumn(),
    ...timestamps(),
    sellerId: integer('seller_id')
      .notNull()
      .references(() => sellers.id, { onDelete: 'restrict' }),
    sellerShopName: varchar('seller_shop_name', { length: 160 }).notNull(),
    sellerLogoKey: varchar('seller_logo_key', { length: 80 }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    categorySlug: varchar('category_slug', { length: 80 }).notNull(),
    categoryNameFa: varchar('category_name_fa', { length: 120 }).notNull(),
    categoryNameEn: varchar('category_name_en', { length: 120 }).notNull(),
    parentCategoryId: integer('parent_category_id'),
    slug: varchar('slug', { length: 80 }).notNull(),
    nameFa: varchar('name_fa', { length: 180 }).notNull(),
    nameEn: varchar('name_en', { length: 180 }).notNull(),
    shortDescriptionFa: varchar('short_description_fa', { length: 240 }),
    shortDescriptionEn: varchar('short_description_en', { length: 240 }),
    descriptionFa: varchar('description_fa', { length: 4000 }),
    descriptionEn: varchar('description_en', { length: 4000 }),
    brand: varchar('brand', { length: 80 }),
    sku: varchar('sku', { length: 80 }),
    status: varchar('status', { length: 20 })
      .notNull()
      .default(ProductStatus.DRAFT),
    published: boolean('published').notNull().default(false),
    quantity: integer('quantity').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
    retailPrice: integer('retail_price').notNull(),
    compareAtPrice: integer('compare_at_price'),
    discountPercent: integer('discount_percent').notNull().default(0),
    catalogKey: varchar('catalog_key', { length: 80 }),
    wholesaleMoq: integer('wholesale_moq'),
    wholesaleMaxQty: integer('wholesale_max_qty'),
    wholesalePackMultiple: integer('wholesale_pack_multiple'),
    wholesaleCashPrice: integer('wholesale_cash_price'),
    wholesalePackPrice: integer('wholesale_pack_price'),
    wholesaleInstallmentMonths: integer('wholesale_installment_months'),
    wholesaleInstallmentFeePercent: integer(
      'wholesale_installment_fee_percent',
    ),
    specs: jsonb('specs').$type<ProductSpecProps[]>().notNull().default([]),
    productionDate: varchar('production_date', { length: 16 }),
    expiryDate: varchar('expiry_date', { length: 16 }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    unique('UQ_products_slug').on(table.slug),
    index('IDX_products_seller_id').on(table.sellerId),
    index('IDX_products_category_id').on(table.categoryId),
    index('IDX_products_category_slug').on(table.categorySlug),
    index('IDX_products_status').on(table.status),
    index('IDX_products_published').on(table.published),
    index('IDX_products_updated_at').on(table.updatedAt),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: idColumn(),
    ...timestamps(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    imageKey: varchar('image_key', { length: 120 }).notNull(),
    altFa: varchar('alt_fa', { length: 160 }),
    altEn: varchar('alt_en', { length: 160 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('IDX_product_images_product_id').on(table.productId)],
);

export const productPriceTiers = pgTable(
  'product_price_tiers',
  {
    id: idColumn(),
    ...timestamps(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    minQty: integer('min_qty').notNull(),
    maxQty: integer('max_qty'),
    unitPrice: integer('unit_price').notNull(),
  },
  (table) => [index('IDX_product_price_tiers_product_id').on(table.productId)],
);

export type ProductRow = typeof products.$inferSelect;
export type ProductImageRow = typeof productImages.$inferSelect;
export type ProductPriceTierRow = typeof productPriceTiers.$inferSelect;
