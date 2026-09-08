import { Inject, Injectable } from '@nestjs/common';
import CountPublishedProductsQuery from '../../../../products/domain/application/queries/count-published-products.query';
import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import type CategoryRepositoryPort from '../../ports/category.repository.port';
import CategoryViewFactory from '../../view-models/category-view.factory';
import type { CategorySummaryView } from '../../view-models/category.view-model';
import { CATEGORY_REPOSITORY } from '../../../shared/tokens/port.token';
import SearchCategoriesQuery from '../queries/search-categories.query';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

@Injectable()
export default class SearchCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepositoryPort,
    private readonly countPublishedProducts: CountPublishedProductsUseCase,
  ) {}

  async execute(query: SearchCategoriesQuery): Promise<CategorySummaryView[]> {
    const term = query.query.trim();
    if (term.length < 1) {
      return [];
    }
    const limit =
      Math.min(Math.max(query.limit, 1), MAX_LIMIT) || DEFAULT_LIMIT;
    const matches = await this.categories.searchByName(term, limit);
    const counts = await this.countPublishedProducts.execute(
      new CountPublishedProductsQuery(
        matches.map((category) => category.getId()),
      ),
    );
    return matches.map((category) =>
      CategoryViewFactory.summary(
        category,
        query.lang,
        counts.get(category.getId()) ?? 0,
      ),
    );
  }
}
