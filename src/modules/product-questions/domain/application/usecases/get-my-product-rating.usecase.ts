import { Inject, Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import type ProductRatingRepositoryPort from '../../ports/product-rating.repository.port';
import { PRODUCT_RATING_REPOSITORY } from '../../../shared/tokens/port.token';
import GetMyProductRatingQuery from '../queries/get-my-product-rating.query';

@Injectable()
export default class GetMyProductRatingUseCase {
  constructor(
    @Inject(PRODUCT_RATING_REPOSITORY)
    private readonly ratings: ProductRatingRepositoryPort,
    private readonly getProductById: GetProductByIdUseCase,
  ) {}

  async execute(
    query: GetMyProductRatingQuery,
  ): Promise<{ rating: number | null }> {
    await this.getProductById.execute(
      new GetProductByIdQuery(query.productId, true),
    );
    const existing = await this.ratings.findByUserAndProduct(
      query.userId,
      query.productId,
    );
    return { rating: existing?.getRating() ?? null };
  }
}
