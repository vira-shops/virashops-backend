export type CategorySummaryView = {
  id: number;
  slug: string;
  name: string;
  nameFa: string;
  nameEn: string;
  parentId: number | null;
  depth: number;
  iconKey: string | null;
  imageKey: string | null;
  sortOrder: number;
  productCount: number;
};

export type CategoryTreeNodeView = CategorySummaryView & {
  children: CategoryTreeNodeView[];
};

export type CategoryHomeView = {
  shortcuts: CategorySummaryView[];
  featured: {
    parent: CategorySummaryView;
    children: CategorySummaryView[];
  } | null;
};

export type CategoryDetailView = {
  category: CategorySummaryView;
  ancestors: CategorySummaryView[];
  children: CategorySummaryView[];
};
