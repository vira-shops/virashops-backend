import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import InMemoryProductRepository from '../../../../products/domain/application/usecases/in-memory-product.repository';
import CategoryNotFoundError from '../../errors/category-not-found.error';
import GetCategoryBySlugQuery from '../queries/get-category-by-slug.query';
import GetCategoryBySlugUseCase from './get-category-by-slug.usecase';
import InMemoryCategoryRepository from './in-memory-category.repository';

describe('GetCategoryBySlugUseCase', () => {
  const useCase = new GetCategoryBySlugUseCase(
    new InMemoryCategoryRepository(),
    new CountPublishedProductsUseCase(new InMemoryProductRepository()),
  );

  it('returns breadcrumb and children', async () => {
    const detail = await useCase.execute(
      new GetCategoryBySlugQuery('staples', 'en'),
    );
    expect(detail.category.name).toBe('Staples');
    expect(detail.ancestors.map((node) => node.slug)).toEqual(['food']);
    expect(detail.children.map((node) => node.slug)).toEqual(['bread']);
    expect(detail.children[0].productCount).toBe(1);
  });

  it('throws when the slug is missing', async () => {
    await expect(
      useCase.execute(new GetCategoryBySlugQuery('missing', 'en')),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });
});
