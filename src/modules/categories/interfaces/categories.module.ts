import { Module } from '@nestjs/common';
import ProductsModule from '../../products/interfaces/products.module';
import GetCategoryBySlugUseCase from '../domain/application/usecases/get-category-by-slug.usecase';
import GetCategoryTreeUseCase from '../domain/application/usecases/get-category-tree.usecase';
import GetHomeCategoriesUseCase from '../domain/application/usecases/get-home-categories.usecase';
import SearchCategoriesUseCase from '../domain/application/usecases/search-categories.usecase';
import CategoriesInfrastructureModule from '../infrastructure/infrastructure.module';
import CategoriesController from './http/controllers/categories.controller';

@Module({
  imports: [CategoriesInfrastructureModule, ProductsModule],
  controllers: [CategoriesController],
  providers: [
    GetCategoryTreeUseCase,
    GetHomeCategoriesUseCase,
    GetCategoryBySlugUseCase,
    SearchCategoriesUseCase,
  ],
  exports: [SearchCategoriesUseCase],
})
export default class CategoriesModule {}
