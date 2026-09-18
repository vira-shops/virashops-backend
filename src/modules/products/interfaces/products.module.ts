import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import SellersModule from '../../sellers/interfaces/sellers.module';
import UsersModule from '../../users/interfaces/users.module';
import ProductMediaPresenter from '../domain/application/services/product-media.presenter';
import CountPublishedProductsUseCase from '../domain/application/usecases/count-published-products.usecase';
import GetProductByIdUseCase from '../domain/application/usecases/get-product-by-id.usecase';
import GetProductBySlugUseCase from '../domain/application/usecases/get-product-by-slug.usecase';
import ListProductsUseCase from '../domain/application/usecases/list-products.usecase';
import SetProductImagesUseCase from '../domain/application/usecases/set-product-images.usecase';
import ProductsInfrastructureModule from '../infrastructure/infrastructure.module';
import AdminProductsController from './http/controllers/admin-products.controller';
import ProductsController from './http/controllers/products.controller';
import SellerProductsController from './http/controllers/seller-products.controller';

@Module({
  imports: [
    ProductsInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
    SellersModule,
  ],
  controllers: [
    ProductsController,
    SellerProductsController,
    AdminProductsController,
  ],
  providers: [
    ProductMediaPresenter,
    ListProductsUseCase,
    GetProductBySlugUseCase,
    GetProductByIdUseCase,
    CountPublishedProductsUseCase,
    SetProductImagesUseCase,
  ],
  exports: [
    ListProductsUseCase,
    GetProductBySlugUseCase,
    GetProductByIdUseCase,
    CountPublishedProductsUseCase,
  ],
})
export default class ProductsModule {}
