import CatalogChannel from '../../model/enums/catalog-channel.enum';
import ProductSort from '../../model/enums/product-sort.enum';
import ListProductsQuery from '../queries/list-products.query';
import InMemoryProductRepository from './in-memory-product.repository';
import ListProductsUseCase from './list-products.usecase';

describe('ListProductsUseCase', () => {
  const useCase = new ListProductsUseCase(new InMemoryProductRepository());

  it('lists published products with pagination', async () => {
    const page = await useCase.execute(
      new ListProductsQuery('en', CatalogChannel.RETAIL, 1, 2),
    );
    expect(page.total).toBeGreaterThanOrEqual(6);
    expect(page.items).toHaveLength(2);
    expect(page.page).toBe(1);
    expect(page.limit).toBe(2);
    expect(page.items[0].slug).toBe('pepsi-cola-6pk');
  });

  it('filters by category slug and hides drafts', async () => {
    const page = await useCase.execute(
      new ListProductsQuery(
        'fa',
        CatalogChannel.RETAIL,
        1,
        20,
        ProductSort.RELEVANT,
        undefined,
        'soda',
      ),
    );
    expect(page.items.map((item) => item.slug)).toEqual([
      'pepsi-cola-6pk',
      'coca-cola-6pk',
    ]);
    expect(page.items.every((item) => item.name.length > 0)).toBe(true);
  });

  it('returns wholesale unit price on the wholesale channel', async () => {
    const page = await useCase.execute(
      new ListProductsQuery(
        'en',
        CatalogChannel.WHOLESALE,
        1,
        20,
        ProductSort.RELEVANT,
        undefined,
        'soda',
      ),
    );
    expect(page.items[0].price).toBe(2400000);
    expect(page.items[0].channel).toBe(CatalogChannel.WHOLESALE);
  });

  it('returns an empty page for an unknown category', async () => {
    const page = await useCase.execute(
      new ListProductsQuery(
        'en',
        CatalogChannel.RETAIL,
        1,
        20,
        ProductSort.RELEVANT,
        undefined,
        'does-not-exist',
      ),
    );
    expect(page).toEqual({ items: [], total: 0, page: 1, limit: 20 });
  });
});
