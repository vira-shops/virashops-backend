import { Inject, Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import InvalidProductRatingError from '../../errors/invalid-product-rating.error';
import ProductRating from '../../model/product-rating.model';
import type ProductRatingRepositoryPort from '../../ports/product-rating.repository.port';
import { PRODUCT_RATING_REPOSITORY } from '../../../shared/tokens/port.token';
import RateProductCommand from '../commands/rate-product.command';

@Injectable()
export default class RateProductUseCase {
  constructor(
    @Inject(PRODUCT_RATING_REPOSITORY)
    private readonly ratings: ProductRatingRepositoryPort,
    private readonly getProductById: GetProductByIdUseCase,
  ) {}

  async execute(command: RateProductCommand): Promise<ProductRating> {
    if (
      !Number.isInteger(command.rating) ||
      command.rating < 1 ||
      command.rating > 5
    ) {
      throw new InvalidProductRatingError();
    }
    await this.getProductById.execute(
      new GetProductByIdQuery(command.productId, true),
    );
    return this.ratings.upsert(
      ProductRating.create(command.userId, command.productId, command.rating),
    );
  }
}
