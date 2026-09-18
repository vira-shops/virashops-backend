import { Inject, Injectable } from '@nestjs/common';
import ProductNotFoundError from '../../errors/product-not-found.error';
import Product from '../../model/product.model';
import type ProductRepositoryPort from '../../ports/product.repository.port';
import { PRODUCT_REPOSITORY } from '../../../shared/tokens/port.token';
import GetProductByIdQuery from '../queries/get-product-by-id.query';

@Injectable()
export default class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
  ) {}

  async execute(query: GetProductByIdQuery): Promise<Product> {
    const product = await this.products.findById(query.productId);
    if (!product || (query.requireVisible && !product.isPubliclyVisible())) {
      throw new ProductNotFoundError();
    }
    return product;
  }
}
