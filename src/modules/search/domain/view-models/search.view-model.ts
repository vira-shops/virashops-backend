import type { CategorySummaryView } from '../../../categories/domain/view-models/category.view-model';
import type { ProductPageView } from '../../../products/domain/view-models/product.view-model';

export type SearchSuggestionCategory = {
  id: number;
  slug: string;
  name: string;
};

export type SearchSuggestionsView = {
  categorized: Array<{
    text: string;
    category: SearchSuggestionCategory;
  }>;
  terms: string[];
};

export type SearchCatalogView = {
  query: string;
  products: ProductPageView;
  categories: CategorySummaryView[];
};

export function toSuggestionCategory(
  category: CategorySummaryView,
): SearchSuggestionCategory {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
  };
}
