import { Inject, Injectable } from '@nestjs/common';
import CountPublishedProductsQuery from '../../../../products/domain/application/queries/count-published-products.query';
import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import CategoryNotFoundError from '../../errors/category-not-found.error';
import type CategoryRepositoryPort from '../../ports/category.repository.port';
import CategoryViewFactory from '../../view-models/category-view.factory';
import type {
  CategoryDetailView,
  CategorySummaryView,
} from '../../view-models/category.view-model';
import { CATEGORY_REPOSITORY } from '../../../shared/tokens/port.token';
import GetCategoryBySlugQuery from '../queries/get-category-by-slug.query';

@Injectable()
export default class GetCategoryBySlugUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepositoryPort,
    private readonly countPublishedProducts: CountPublishedProductsUseCase,
  ) {}

  async execute(query: GetCategoryBySlugQuery): Promise<CategoryDetailView> {
    const slug = query.slug.trim().toLowerCase();
    const category = await this.categories.findBySlug(slug);
    if (!category || !category.isActive()) {
      throw new CategoryNotFoundError();
    }

    const tree = await this.categories.findActiveTree();
    const byId = new Map(tree.map((node) => [node.getId(), node]));
    const relatedIds = [
      category.getId(),
      ...tree
        .filter((node) => node.getParentId() === category.getId())
        .map((node) => node.getId()),
    ];
    let parentId = category.getParentId();
    while (parentId !== null) {
      relatedIds.push(parentId);
      const parent = byId.get(parentId);
      parentId = parent?.getParentId() ?? null;
    }
    const counts = await this.countPublishedProducts.execute(
      new CountPublishedProductsQuery(relatedIds),
    );
    const summary = (node: (typeof tree)[number]): CategorySummaryView =>
      CategoryViewFactory.summary(
        node,
        query.lang,
        counts.get(node.getId()) ?? 0,
      );

    const ancestors: CategorySummaryView[] = [];
    parentId = category.getParentId();
    while (parentId !== null) {
      const parent = byId.get(parentId);
      if (!parent) {
        break;
      }
      ancestors.unshift(summary(parent));
      parentId = parent.getParentId();
    }

    const children = tree
      .filter((node) => node.getParentId() === category.getId())
      .sort(
        (left, right) =>
          left.getSortOrder() - right.getSortOrder() ||
          left.getId() - right.getId(),
      )
      .map(summary);

    return {
      category: summary(category),
      ancestors,
      children,
    };
  }
}
