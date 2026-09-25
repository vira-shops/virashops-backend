import { Inject, Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import type ProductRatingRepositoryPort from '../../ports/product-rating.repository.port';
import type { ProductRatingSummary } from '../../ports/product-rating.repository.port';
import { PRODUCT_RATING_REPOSITORY } from '../../../shared/tokens/port.token';
import GetProductRatingSummaryQuery from '../queries/get-product-rating-summary.query';

@Injectable()
export default class GetProductRatingSummaryUseCase {
  constructor(
    @Inject(PRODUCT_RATING_REPOSITORY)
    private readonly ratings: ProductRatingRepositoryPort,
    private readonly getProductById: GetProductByIdUseCase,
  ) {}

  async execute(
    query: GetProductRatingSummaryQuery,
  ): Promise<ProductRatingSummary> {
    await this.getProductById.execute(
      new GetProductByIdQuery(query.productId, true),
    );
    return this.ratings.summarizeForProduct(query.productId);
  }
}
