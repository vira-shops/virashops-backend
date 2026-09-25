import ProductRating from '../model/product-rating.model';

export type ProductRatingSummary = {
  average: number;
  count: number;
};

export default interface ProductRatingRepositoryPort {
  findByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<ProductRating | null>;
  upsert(rating: ProductRating): Promise<ProductRating>;
  summarizeForProduct(productId: number): Promise<ProductRatingSummary>;
}
