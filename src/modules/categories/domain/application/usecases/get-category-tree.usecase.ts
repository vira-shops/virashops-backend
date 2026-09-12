import { Inject, Injectable } from '@nestjs/common';
import CountPublishedProductsQuery from '../../../../products/domain/application/queries/count-published-products.query';
import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import type CategoryRepositoryPort from '../../ports/category.repository.port';
import CategoryViewFactory from '../../view-models/category-view.factory';
import type { CategoryTreeNodeView } from '../../view-models/category.view-model';
import { CATEGORY_REPOSITORY } from '../../../shared/tokens/port.token';
import GetCategoryTreeQuery from '../queries/get-category-tree.query';

@Injectable()
export default class GetCategoryTreeUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepositoryPort,
    private readonly countPublishedProducts: CountPublishedProductsUseCase,
  ) {}

  async execute(query: GetCategoryTreeQuery): Promise<CategoryTreeNodeView[]> {
    const tree = await this.categories.findActiveTree();
    const counts = await this.countPublishedProducts.execute(
      new CountPublishedProductsQuery(tree.map((category) => category.getId())),
    );
    return CategoryViewFactory.tree(tree, query.lang, counts);
  }
}
