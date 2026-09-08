import { Injectable } from '@nestjs/common';
import SearchCategoriesQuery from '../../../../categories/domain/application/queries/search-categories.query';
import SearchCategoriesUseCase from '../../../../categories/domain/application/usecases/search-categories.usecase';
import CatalogChannel from '../../../../products/domain/model/enums/catalog-channel.enum';
import ListProductsQuery from '../../../../products/domain/application/queries/list-products.query';
import ListProductsUseCase from '../../../../products/domain/application/usecases/list-products.usecase';
import SearchCatalogQuery from '../queries/search-catalog.query';
import type { SearchCatalogView } from '../../view-models/search.view-model';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Injectable()
export default class SearchCatalogUseCase {
  constructor(
    private readonly searchCategories: SearchCategoriesUseCase,
    private readonly listProducts: ListProductsUseCase,
  ) {}

  async execute(query: SearchCatalogQuery): Promise<SearchCatalogView> {
    const term = query.query.trim();
    const page = Math.max(query.page, 1);
    const limit =
      Math.min(Math.max(query.limit, 1), MAX_LIMIT) || DEFAULT_LIMIT;

    const [categories, products] = await Promise.all([
      term.length < 1
        ? Promise.resolve([])
        : this.searchCategories.execute(
            new SearchCategoriesQuery(term, query.lang, 10),
          ),
      this.listProducts.execute(
        new ListProductsQuery(
          query.lang,
          query.channel ?? CatalogChannel.RETAIL,
          page,
          limit,
          query.sort,
          query.categoryId,
          undefined,
          term.length < 1 ? undefined : term,
          query.minPrice,
          query.maxPrice,
        ),
      ),
    ]);

    return {
      query: term,
      products,
      categories,
    };
  }
}
