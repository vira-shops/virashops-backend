import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import InMemoryProductRepository from '../../../../products/domain/application/usecases/in-memory-product.repository';
import SearchCategoriesQuery from '../queries/search-categories.query';
import InMemoryCategoryRepository from './in-memory-category.repository';
import SearchCategoriesUseCase from './search-categories.usecase';

describe('SearchCategoriesUseCase', () => {
  const useCase = new SearchCategoriesUseCase(
    new InMemoryCategoryRepository(),
    new CountPublishedProductsUseCase(new InMemoryProductRepository()),
  );

  it('matches Persian names', async () => {
    const hits = await useCase.execute(
      new SearchCategoriesQuery('مرغ', 'fa', 10),
    );
    expect(hits.map((hit) => hit.slug)).toEqual(['chicken']);
    expect(hits[0].productCount).toBe(1);
  });

  it('returns nothing for a blank query', async () => {
    const hits = await useCase.execute(new SearchCategoriesQuery('  ', 'en'));
    expect(hits).toEqual([]);
  });
});
