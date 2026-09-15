import ProductMediaPresenter from './product-media.presenter';
import type {
  ProductCardView,
  ProductDetailView,
} from '../../view-models/product.view-model';
import CatalogChannel from '../../model/enums/catalog-channel.enum';
import StockStatus from '../../model/enums/stock-status.enum';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';

describe('ProductMediaPresenter', () => {
  const getSignedUrl = jest.fn();
  const storage: FileStorageServicePort = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl,
  };
  const presenter = new ProductMediaPresenter(storage);

  beforeEach(() => {
    jest.clearAllMocks();
    getSignedUrl.mockImplementation((key: string) =>
      Promise.resolve(`https://cdn.test/${key}?sig=1`),
    );
  });

  const baseCard = (
    overrides: Partial<ProductCardView> = {},
  ): ProductCardView => ({
    id: 1,
    slug: 'pepsi-cola-6pk',
    name: 'Pepsi',
    imageKey: 'pepsi-cola-6pk',
    imageUrl: null,
    price: 100,
    compareAtPrice: null,
    discountPercent: 0,
    badges: [],
    stockStatus: StockStatus.IN_STOCK,
    seller: {
      id: 1,
      shopName: 'Shop',
      logoKey: 'virashops',
      logoUrl: null,
    },
    storeCount: 1,
    channel: CatalogChannel.RETAIL,
    ...overrides,
  });

  it('leaves legacy asset keys without urls', async () => {
    const card = await presenter.enrichCard(baseCard());
    expect(card.imageUrl).toBeNull();
    expect(card.seller.logoUrl).toBeNull();
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('presigns stored upload keys on cards and gallery', async () => {
    const card = await presenter.enrichCard(
      baseCard({
        imageKey: 'uploads/a.jpg',
        seller: {
          id: 1,
          shopName: 'Shop',
          logoKey: 'uploads/logo.png',
          logoUrl: null,
        },
      }),
    );
    expect(card.imageUrl).toBe('https://cdn.test/uploads/a.jpg?sig=1');
    expect(card.seller.logoUrl).toBe('https://cdn.test/uploads/logo.png?sig=1');

    const detail = await presenter.enrichDetail({
      ...card,
      shortDescription: null,
      description: null,
      brand: null,
      sku: null,
      gallery: [
        {
          imageKey: 'uploads/a.jpg',
          url: null,
          alt: null,
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      specs: [],
      productionDate: null,
      expiryDate: null,
      category: { id: 1, slug: 'soda', name: 'Soda' },
      wholesale: null,
      related: [],
    } satisfies ProductDetailView);

    expect(detail.gallery[0].url).toBe('https://cdn.test/uploads/a.jpg?sig=1');
  });
});
