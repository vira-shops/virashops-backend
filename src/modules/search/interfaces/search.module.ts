import { Module } from '@nestjs/common';
import CategoriesModule from '../../categories/interfaces/categories.module';
import ProductsModule from '../../products/interfaces/products.module';
import SearchCatalogUseCase from '../domain/application/usecases/search-catalog.usecase';
import SuggestSearchUseCase from '../domain/application/usecases/suggest-search.usecase';
import SearchController from './http/controllers/search.controller';

@Module({
  imports: [CategoriesModule, ProductsModule],
  controllers: [SearchController],
  providers: [SuggestSearchUseCase, SearchCatalogUseCase],
})
export default class SearchModule {}
