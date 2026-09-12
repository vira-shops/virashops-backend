import { Module } from '@nestjs/common';
import CountPublishedProductsUseCase from '../domain/application/usecases/count-published-products.usecase';
import GetProductBySlugUseCase from '../domain/application/usecases/get-product-by-slug.usecase';
import ListProductsUseCase from '../domain/application/usecases/list-products.usecase';
import ProductsInfrastructureModule from '../infrastructure/infrastructure.module';
import ProductsController from './http/controllers/products.controller';

@Module({
  imports: [ProductsInfrastructureModule],
  controllers: [ProductsController],
  providers: [
    ListProductsUseCase,
    GetProductBySlugUseCase,
    CountPublishedProductsUseCase,
  ],
  exports: [
    ListProductsUseCase,
    GetProductBySlugUseCase,
    CountPublishedProductsUseCase,
  ],
})
export default class ProductsModule {}
