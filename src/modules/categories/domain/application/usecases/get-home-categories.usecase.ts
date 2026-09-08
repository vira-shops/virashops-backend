import { Inject, Injectable } from '@nestjs/common';
import CountPublishedProductsQuery from '../../../../products/domain/application/queries/count-published-products.query';
import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import type CategoryRepositoryPort from '../../ports/category.repository.port';
import CategoryViewFactory from '../../view-models/category-view.factory';
import type { CategoryHomeView } from '../../view-models/category.view-model';
import { CATEGORY_REPOSITORY } from '../../../shared/tokens/port.token';
import GetHomeCategoriesQuery from '../queries/get-home-categories.query';

@Injectable()
export default class GetHomeCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepositoryPort,
    private readonly countPublishedProducts: CountPublishedProductsUseCase,
  ) {}

  async execute(query: GetHomeCategoriesQuery): Promise<CategoryHomeView> {
    const all = await this.categories.findActiveTree();
    const counts = await this.countPublishedProducts.execute(
      new CountPublishedProductsQuery(all.map((category) => category.getId())),
    );
    const summary = (category: (typeof all)[number]) =>
      CategoryViewFactory.summary(
        category,
        query.lang,
        counts.get(category.getId()) ?? 0,
      );

    const roots = all
      .filter((category) => category.isRoot())
      .sort(
        (left, right) =>
          left.getSortOrder() - right.getSortOrder() ||
          left.getId() - right.getId(),
      );
    const featuredParent = roots[0] ?? null;
    const shortcuts = all
      .filter(
        (category) =>
          category.getDepth() === 2 && category.getIconKey() !== null,
      )
      .sort(
        (left, right) =>
          left.getSortOrder() - right.getSortOrder() ||
          left.getId() - right.getId(),
      );

    return {
      shortcuts: shortcuts.map(summary),
      featured: featuredParent
        ? {
            parent: summary(featuredParent),
            children: all
              .filter(
                (category) => category.getParentId() === featuredParent.getId(),
              )
              .sort(
                (left, right) =>
                  left.getSortOrder() - right.getSortOrder() ||
                  left.getId() - right.getId(),
              )
              .map(summary),
          }
        : null,
    };
  }
}
