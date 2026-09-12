import { Inject, Injectable } from '@nestjs/common';
import type ProductRepositoryPort from '../../ports/product.repository.port';
import { PRODUCT_REPOSITORY } from '../../../shared/tokens/port.token';
import CountPublishedProductsQuery from '../queries/count-published-products.query';

@Injectable()
export default class CountPublishedProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
  ) {}

  async execute(
    query: CountPublishedProductsQuery,
  ): Promise<Map<number, number>> {
    const uniqueIds = [...new Set(query.categoryIds.filter((id) => id > 0))];
    return this.products.countPublishedByCategoryIds(uniqueIds);
  }
}
