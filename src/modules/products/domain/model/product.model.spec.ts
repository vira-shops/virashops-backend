import InvalidProductFieldError from '../errors/invalid-product-field.error';
import CatalogChannel from './enums/catalog-channel.enum';
import ProductStatus from './enums/product-status.enum';
import StockStatus from './enums/stock-status.enum';
import Product, { DEFAULT_LOW_STOCK_THRESHOLD } from './product.model';
import type { ProductProps } from './product.model';

function baseInput(
  overrides: Partial<ProductProps> = {},
): Omit<ProductProps, 'id' | 'status' | 'published' | 'updatedAt'> {
  return {
    seller: { id: 1, shopName: 'ViraShops', logoKey: 'virashops' },
    category: {
      id: 18,
      slug: 'soda',
      nameFa: 'نوشابه',
      nameEn: 'Soda',
      parentId: 7,
    },
    slug: 'pepsi-cola-6pk',
    nameFa: 'نوشابه کولا پپسی',
    nameEn: 'Pepsi Cola Soft Drink',
    shortDescriptionFa: 'بسته ۶ عددی ۱.۵ لیتر',
    shortDescriptionEn: '6-pack of 1.5L bottles',
    descriptionFa: null,
    descriptionEn: null,
    brand: 'Pepsi',
    sku: 'PEPSI-15-6',
    quantity: 40,
    lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    retailPrice: 2540000,
    compareAtPrice: 2800000,
    discountPercent: 20,
    wholesale: null,
    specs: [],
    images: [
      {
        imageKey: 'pepsi-cola-6pk',
        altFa: 'پپسی',
        altEn: 'Pepsi',
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    productionDate: '1402/05/17',
    expiryDate: '1403/05/17',
    catalogKey: 'pepsi-1.5l-6pk',
    sortOrder: 1,
    ...overrides,
  };
}

describe('Product', () => {
  it('creates a draft that is not publicly visible', () => {
    const product = Product.create(baseInput());
    expect(product.isPublished()).toBe(false);
    expect(product.isPubliclyVisible()).toBe(false);
    expect(product.getName('fa')).toBe('نوشابه کولا پپسی');
    expect(product.getName('en')).toBe('Pepsi Cola Soft Drink');
  });

  it('exposes an active published product', () => {
    const product = Product.restore({
      ...baseInput(),
      id: 1,
      status: ProductStatus.ACTIVE,
      published: true,
      updatedAt: new Date('2026-01-01'),
    });
    expect(product.isPubliclyVisible()).toBe(true);
    expect(product.getStockStatus()).toBe(StockStatus.IN_STOCK);
    expect(product.getPrimaryImageKey()).toBe('pepsi-cola-6pk');
  });

  it('derives out-of-stock and low-stock from quantity', () => {
    const empty = Product.create(baseInput({ quantity: 0 }));
    expect(empty.getStockStatus()).toBe(StockStatus.OUT_OF_STOCK);

    const low = Product.create(
      baseInput({ quantity: DEFAULT_LOW_STOCK_THRESHOLD }),
    );
    expect(low.getStockStatus()).toBe(StockStatus.LOW_STOCK);
  });

  it('uses wholesale cash price on the wholesale channel', () => {
    const product = Product.create(
      baseInput({
        wholesale: {
          moq: 1,
          maxQty: 20,
          packMultiple: 1,
          cashPrice: 2400000,
          packPrice: 2540000,
          installment: { months: 5, monthlyFeePercent: 4 },
          tiers: [{ minQty: 1, maxQty: 5, unitPrice: 2540000 }],
        },
      }),
    );
    expect(product.getUnitPrice(CatalogChannel.RETAIL)).toBe(2540000);
    expect(product.getUnitPrice(CatalogChannel.WHOLESALE)).toBe(2400000);
    expect(product.hasWholesale()).toBe(true);
  });

  it('rejects a non-positive retail price', () => {
    expect(() => Product.create(baseInput({ retailPrice: 0 }))).toThrow(
      InvalidProductFieldError,
    );
  });

  it('rejects compare-at at or below sell price', () => {
    expect(() =>
      Product.create(baseInput({ compareAtPrice: 2540000 })),
    ).toThrow(InvalidProductFieldError);
  });

  it('rejects an invalid slug', () => {
    expect(() => Product.create(baseInput({ slug: 'Pepsi Cola' }))).toThrow(
      InvalidProductFieldError,
    );
  });
});
