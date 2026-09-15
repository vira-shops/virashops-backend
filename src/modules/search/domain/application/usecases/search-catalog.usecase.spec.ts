import SearchCategoriesUseCase from '../../../../categories/domain/application/usecases/search-categories.usecase';
import InMemoryCategoryRepository from '../../../../categories/domain/application/usecases/in-memory-category.repository';
import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import InMemoryProductRepository from '../../../../products/domain/application/usecases/in-memory-product.repository';
import ListProductsUseCase from '../../../../products/domain/application/usecases/list-products.usecase';
import ProductMediaPresenter from '../../../../products/domain/application/services/product-media.presenter';
import CatalogChannel from '../../../../products/domain/model/enums/catalog-channel.enum';
import ProductSort from '../../../../products/domain/model/enums/product-sort.enum';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';
import SearchCatalogQuery from '../queries/search-catalog.query';
import SearchCatalogUseCase from './search-catalog.usecase';

function media(): ProductMediaPresenter {
  const files: FileStorageServicePort = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl: jest.fn(() => Promise.resolve('/uploads/x')),
  };
  return new ProductMediaPresenter(files);
}

describe('SearchCatalogUseCase', () => {
  const products = new InMemoryProductRepository();
  const useCase = new SearchCatalogUseCase(
    new SearchCategoriesUseCase(
      new InMemoryCategoryRepository(),
      new CountPublishedProductsUseCase(products),
    ),
    new ListProductsUseCase(products, media()),
  );

  it('returns category hits and matching product cards', async () => {
    const result = await useCase.execute(
      new SearchCatalogQuery('chicken', 'en', 1, 10),
    );
    expect(result.query).toBe('chicken');
    expect(result.products.page).toBe(1);
    expect(result.products.limit).toBe(10);
    expect(result.products.items.map((item) => item.slug)).toContain(
      'chicken-breast-1kg',
    );
    expect(result.categories.map((category) => category.slug)).toEqual([
      'chicken',
    ]);
  });

  it('applies category, channel, and cheapest sort filters', async () => {
    const result = await useCase.execute(
      new SearchCatalogQuery(
        '',
        'en',
        1,
        20,
        CatalogChannel.WHOLESALE,
        ProductSort.CHEAPEST,
        18,
      ),
    );
    expect(result.products.items.map((item) => item.slug)).toEqual([
      'coca-cola-6pk',
      'pepsi-cola-6pk',
    ]);
    expect(result.products.items[0].channel).toBe(CatalogChannel.WHOLESALE);
    expect(result.products.items[0].price).toBe(2380000);
  });
});
