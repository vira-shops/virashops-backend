import { Inject, Injectable } from '@nestjs/common';
import type ProductRepositoryPort from '../../ports/product.repository.port';
import ProductViewFactory from '../../view-models/product-view.factory';
import type { ProductPageView } from '../../view-models/product.view-model';
import { PRODUCT_REPOSITORY } from '../../../shared/tokens/port.token';
import ListProductsQuery from '../queries/list-products.query';
import ProductMediaPresenter from '../services/product-media.presenter';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Injectable()
export default class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
    private readonly media: ProductMediaPresenter,
  ) {}

  async execute(query: ListProductsQuery): Promise<ProductPageView> {
    const page = Math.max(query.page, 1);
    const limit =
      Math.min(Math.max(query.limit, 1), MAX_LIMIT) || DEFAULT_LIMIT;
    const term = query.query?.trim() || undefined;

    const result = await this.products.listPublished({
      categoryId: query.categoryId,
      categorySlug: query.categorySlug?.trim().toLowerCase() || undefined,
      query: term && term.length > 0 ? term : undefined,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sort: query.sort,
      page,
      limit,
    });

    return this.media.enrichPage({
      items: result.items.map((product) =>
        ProductViewFactory.card(product, query.lang, query.channel),
      ),
      total: result.total,
      page,
      limit,
    });
  }
}
