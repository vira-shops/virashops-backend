import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import InMemoryProductRepository from '../../../../products/domain/application/usecases/in-memory-product.repository';
import GetHomeCategoriesQuery from '../queries/get-home-categories.query';
import GetHomeCategoriesUseCase from './get-home-categories.usecase';
import InMemoryCategoryRepository from './in-memory-category.repository';

describe('GetHomeCategoriesUseCase', () => {
  const useCase = new GetHomeCategoriesUseCase(
    new InMemoryCategoryRepository(),
    new CountPublishedProductsUseCase(new InMemoryProductRepository()),
  );

  it('returns shortcut icons and the featured food grid', async () => {
    const home = await useCase.execute(new GetHomeCategoriesQuery('fa'));
    expect(home.shortcuts.map((item) => item.slug)).toEqual([
      'staples',
      'protein',
    ]);
    expect(home.featured?.parent.slug).toBe('food');
    expect(home.featured?.parent.productCount).toBe(0);
    expect(home.featured?.children.map((item) => item.slug)).toEqual([
      'staples',
      'protein',
    ]);
  });
});
