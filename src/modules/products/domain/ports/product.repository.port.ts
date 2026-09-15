import Product from '../model/product.model';
import ProductSort from '../model/enums/product-sort.enum';
import type { ProductImageProps } from '../model/product.types';

export type ListPublishedProductsFilter = {
  categoryId?: number;
  categorySlug?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: ProductSort;
  page: number;
  limit: number;
};

export type PublishedProductPage = {
  items: Product[];
  total: number;
};

export default interface ProductRepositoryPort {
  listPublished(
    filter: ListPublishedProductsFilter,
  ): Promise<PublishedProductPage>;
  findPublishedBySlug(slug: string): Promise<Product | null>;
  findById(id: number): Promise<Product | null>;
  findPublishedRelated(product: Product, limit: number): Promise<Product[]>;
  countPublishedByCategoryIds(
    categoryIds: number[],
  ): Promise<Map<number, number>>;
  replaceImages(productId: number, images: ProductImageProps[]): Promise<void>;
}
