import CountPublishedProductsQuery from '../queries/count-published-products.query';
import CountPublishedProductsUseCase from './count-published-products.usecase';
import InMemoryProductRepository from './in-memory-product.repository';

describe('CountPublishedProductsUseCase', () => {
  const useCase = new CountPublishedProductsUseCase(
    new InMemoryProductRepository(),
  );

  it('counts published products per category', async () => {
    const counts = await useCase.execute(
      new CountPublishedProductsQuery([18, 4, 999]),
    );
    expect(counts.get(18)).toBe(2);
    expect(counts.get(4)).toBe(2);
    expect(counts.get(999)).toBeUndefined();
  });
});
