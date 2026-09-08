import { Inject, Injectable } from '@nestjs/common';
import ProductNotFoundError from '../../errors/product-not-found.error';
import type ProductRepositoryPort from '../../ports/product.repository.port';
import ProductViewFactory from '../../view-models/product-view.factory';
import type { ProductDetailView } from '../../view-models/product.view-model';
import { PRODUCT_REPOSITORY } from '../../../shared/tokens/port.token';
import GetProductBySlugQuery from '../queries/get-product-by-slug.query';

const RELATED_LIMIT = 8;

@Injectable()
export default class GetProductBySlugUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
  ) {}

  async execute(query: GetProductBySlugQuery): Promise<ProductDetailView> {
    const slug = query.slug.trim().toLowerCase();
    const product = await this.products.findPublishedBySlug(slug);
    if (!product || !product.isPubliclyVisible()) {
      throw new ProductNotFoundError();
    }

    const related = await this.products.findPublishedRelated(
      product,
      RELATED_LIMIT,
    );

    return ProductViewFactory.detail(
      product,
      query.lang,
      query.channel,
      related,
    );
  }
}
