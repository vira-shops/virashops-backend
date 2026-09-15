import CatalogChannel from '../../model/enums/catalog-channel.enum';
import ProductNotFoundError from '../../errors/product-not-found.error';
import GetProductBySlugQuery from '../queries/get-product-by-slug.query';
import ProductMediaPresenter from '../services/product-media.presenter';
import GetProductBySlugUseCase from './get-product-by-slug.usecase';
import InMemoryProductRepository from './in-memory-product.repository';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';

function mediaPresenter(): ProductMediaPresenter {
  const files: FileStorageServicePort = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl: jest.fn((key: string) => Promise.resolve(`/signed/${key}`)),
  };
  return new ProductMediaPresenter(files);
}

describe('GetProductBySlugUseCase', () => {
  const useCase = new GetProductBySlugUseCase(
    new InMemoryProductRepository(),
    mediaPresenter(),
  );

  it('returns detail with related products from the same category', async () => {
    const detail = await useCase.execute(
      new GetProductBySlugQuery('pepsi-cola-6pk', 'en', CatalogChannel.RETAIL),
    );
    expect(detail.slug).toBe('pepsi-cola-6pk');
    expect(detail.wholesale).toBeNull();
    expect(detail.related.map((item) => item.slug)).toContain('coca-cola-6pk');
    expect(detail.related.every((item) => item.slug !== 'pepsi-cola-6pk')).toBe(
      true,
    );
    expect(detail.related.every((item) => item.slug !== 'draft-soda')).toBe(
      true,
    );
  });

  it('includes wholesale tiers on the wholesale channel', async () => {
    const detail = await useCase.execute(
      new GetProductBySlugQuery(
        'pepsi-cola-6pk',
        'fa',
        CatalogChannel.WHOLESALE,
      ),
    );
    expect(detail.price).toBe(2400000);
    expect(detail.wholesale?.cashPrice).toBe(2400000);
    expect(detail.wholesale?.tiers.length).toBeGreaterThan(0);
    expect(detail.wholesale?.installment).toEqual({
      months: 5,
      monthlyFeePercent: 4,
    });
  });

  it('treats unpublished products as not found', async () => {
    await expect(
      useCase.execute(new GetProductBySlugQuery('draft-soda', 'en')),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('throws for unknown slugs', async () => {
    await expect(
      useCase.execute(new GetProductBySlugQuery('missing-product', 'en')),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
