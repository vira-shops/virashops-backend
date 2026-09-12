import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import InMemoryProductRepository from '../../../../products/domain/application/usecases/in-memory-product.repository';
import GetCategoryTreeQuery from '../queries/get-category-tree.query';
import GetCategoryTreeUseCase from './get-category-tree.usecase';
import InMemoryCategoryRepository from './in-memory-category.repository';

describe('GetCategoryTreeUseCase', () => {
  const useCase = new GetCategoryTreeUseCase(
    new InMemoryCategoryRepository(),
    new CountPublishedProductsUseCase(new InMemoryProductRepository()),
  );

  it('nests the mega-menu three levels', async () => {
    const tree = await useCase.execute(new GetCategoryTreeQuery('fa'));
    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('food');
    expect(tree[0].name).toBe('مواد غذایی');
    expect(tree[0].productCount).toBe(0);
    expect(tree[0].children.map((child) => child.slug)).toEqual([
      'staples',
      'protein',
    ]);
    expect(tree[0].children[0].children.map((child) => child.slug)).toEqual([
      'bread',
    ]);
    expect(tree[0].children[0].children[0].productCount).toBe(1);
  });
});
