import Category from '../model/category.model';
import type {
  CategorySummaryView,
  CategoryTreeNodeView,
} from './category.view-model';

export default class CategoryViewFactory {
  static summary(
    category: Category,
    lang: string,
    productCount = 0,
  ): CategorySummaryView {
    return {
      id: category.getId(),
      slug: category.getSlug(),
      name: category.getName(lang),
      nameFa: category.getNameFa(),
      nameEn: category.getNameEn(),
      parentId: category.getParentId(),
      depth: category.getDepth(),
      iconKey: category.getIconKey(),
      imageKey: category.getImageKey(),
      sortOrder: category.getSortOrder(),
      productCount,
    };
  }

  static tree(
    categories: Category[],
    lang: string,
    productCounts: Map<number, number> = new Map(),
  ): CategoryTreeNodeView[] {
    const active = categories
      .filter((category) => category.isActive())
      .sort(
        (left, right) =>
          left.getSortOrder() - right.getSortOrder() ||
          left.getId() - right.getId(),
      );

    const nodes = new Map<number, CategoryTreeNodeView>();
    for (const category of active) {
      nodes.set(category.getId(), {
        ...CategoryViewFactory.summary(
          category,
          lang,
          productCounts.get(category.getId()) ?? 0,
        ),
        children: [],
      });
    }

    const roots: CategoryTreeNodeView[] = [];
    for (const category of active) {
      const node = nodes.get(category.getId());
      if (!node) {
        continue;
      }
      const parentId = category.getParentId();
      if (parentId === null) {
        roots.push(node);
        continue;
      }
      const parent = nodes.get(parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
    return roots;
  }
}
