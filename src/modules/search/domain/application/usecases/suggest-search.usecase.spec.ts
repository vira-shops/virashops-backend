import SearchCategoriesUseCase from '../../../../categories/domain/application/usecases/search-categories.usecase';
import InMemoryCategoryRepository from '../../../../categories/domain/application/usecases/in-memory-category.repository';
import CountPublishedProductsUseCase from '../../../../products/domain/application/usecases/count-published-products.usecase';
import InMemoryProductRepository from '../../../../products/domain/application/usecases/in-memory-product.repository';
import ListProductsUseCase from '../../../../products/domain/application/usecases/list-products.usecase';
import ProductMediaPresenter from '../../../../products/domain/application/services/product-media.presenter';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';
import SuggestSearchQuery from '../queries/suggest-search.query';
import SuggestSearchUseCase from './suggest-search.usecase';

function media(): ProductMediaPresenter {
  const files: FileStorageServicePort = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl: jest.fn(() => Promise.resolve('/uploads/x')),
  };
  return new ProductMediaPresenter(files);
}

describe('SuggestSearchUseCase', () => {
  const products = new InMemoryProductRepository();
  const useCase = new SuggestSearchUseCase(
    new SearchCategoriesUseCase(
      new InMemoryCategoryRepository(),
      new CountPublishedProductsUseCase(products),
    ),
    new ListProductsUseCase(products, media()),
  );

  it('builds overlay categorized suggestions and product terms', async () => {
    const result = await useCase.execute(new SuggestSearchQuery('مرغ', 'fa'));
    expect(result.categorized).toEqual([
      {
        text: 'مرغ',
        category: { id: 15, slug: 'chicken', name: 'مرغ' },
      },
    ]);
    expect(result.terms).toEqual(
      expect.arrayContaining(['مرغ', 'سینه مرغ تازه']),
    );
  });

  it('returns empty lists for an empty query', async () => {
    const result = await useCase.execute(new SuggestSearchQuery('', 'fa'));
    expect(result).toEqual({ categorized: [], terms: [] });
  });
});
