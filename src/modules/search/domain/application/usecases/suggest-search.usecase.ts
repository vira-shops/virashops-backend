import { Injectable } from '@nestjs/common';
import SearchCategoriesQuery from '../../../../categories/domain/application/queries/search-categories.query';
import SearchCategoriesUseCase from '../../../../categories/domain/application/usecases/search-categories.usecase';
import CatalogChannel from '../../../../products/domain/model/enums/catalog-channel.enum';
import ProductSort from '../../../../products/domain/model/enums/product-sort.enum';
import ListProductsQuery from '../../../../products/domain/application/queries/list-products.query';
import ListProductsUseCase from '../../../../products/domain/application/usecases/list-products.usecase';
import SuggestSearchQuery from '../queries/suggest-search.query';
import {
  toSuggestionCategory,
  type SearchSuggestionsView,
} from '../../view-models/search.view-model';

@Injectable()
export default class SuggestSearchUseCase {
  constructor(
    private readonly searchCategories: SearchCategoriesUseCase,
    private readonly listProducts: ListProductsUseCase,
  ) {}

  async execute(query: SuggestSearchQuery): Promise<SearchSuggestionsView> {
    const term = query.query.trim();
    if (term.length < 1) {
      return { categorized: [], terms: [] };
    }

    const [categories, products] = await Promise.all([
      this.searchCategories.execute(
        new SearchCategoriesQuery(term, query.lang, 10),
      ),
      this.listProducts.execute(
        new ListProductsQuery(
          query.lang,
          CatalogChannel.RETAIL,
          1,
          8,
          ProductSort.RELEVANT,
          undefined,
          undefined,
          term,
        ),
      ),
    ]);

    const categorized = categories.map((category) => ({
      text: category.name,
      category: toSuggestionCategory(category),
    }));
    const terms = [
      ...new Set([
        ...categories.map((category) => category.name),
        ...products.items.map((product) => product.name),
      ]),
    ];

    return { categorized, terms };
  }
}
