import Product from '../../model/product.model';
import ProductSort from '../../model/enums/product-sort.enum';
import ProductStatus from '../../model/enums/product-status.enum';
import type ProductRepositoryPort from '../../ports/product.repository.port';
import type {
  ListPublishedProductsFilter,
  PublishedProductPage,
} from '../../ports/product.repository.port';
import { DEFAULT_LOW_STOCK_THRESHOLD } from '../../model/product.model';

export function seedProducts(): Product[] {
  const now = new Date('2026-01-15T00:00:00.000Z');
  const restore = (
    id: number,
    input: Parameters<typeof Product.create>[0] & {
      status?: ProductStatus;
      published?: boolean;
    },
  ) =>
    Product.restore({
      ...input,
      id,
      status: input.status ?? ProductStatus.ACTIVE,
      published: input.published ?? true,
      updatedAt: now,
    });

  const seller = { id: 1, shopName: 'ویراشاپس', logoKey: 'virashops' };

  return [
    restore(1, {
      seller,
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
      descriptionFa: 'نوشابه گازدار کولا پپسی.',
      descriptionEn: 'Pepsi cola soft drink.',
      brand: 'Pepsi',
      sku: 'PEPSI-15-6',
      quantity: 120,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      retailPrice: 2540000,
      compareAtPrice: 2800000,
      discountPercent: 20,
      wholesale: {
        moq: 1,
        maxQty: 40,
        packMultiple: 1,
        cashPrice: 2400000,
        packPrice: 2540000,
        installment: { months: 5, monthlyFeePercent: 4 },
        tiers: [
          { minQty: 1, maxQty: 5, unitPrice: 2540000 },
          { minQty: 6, maxQty: 10, unitPrice: 2480000 },
        ],
      },
      specs: [
        {
          key: 'volume',
          labelFa: 'حجم',
          labelEn: 'Volume',
          valueFa: '۱.۵ لیتر',
          valueEn: '1.5 liters',
        },
      ],
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
    }),
    restore(2, {
      seller,
      category: {
        id: 18,
        slug: 'soda',
        nameFa: 'نوشابه',
        nameEn: 'Soda',
        parentId: 7,
      },
      slug: 'coca-cola-6pk',
      nameFa: 'نوشابه کولا کوکاکولا',
      nameEn: 'Coca-Cola Soft Drink',
      shortDescriptionFa: 'بسته ۶ عددی ۱.۵ لیتر',
      shortDescriptionEn: '6-pack of 1.5L bottles',
      descriptionFa: null,
      descriptionEn: null,
      brand: 'Coca-Cola',
      sku: 'COKE-15-6',
      quantity: 80,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      retailPrice: 2520000,
      compareAtPrice: 2750000,
      discountPercent: 15,
      wholesale: {
        moq: 1,
        maxQty: 40,
        packMultiple: 1,
        cashPrice: 2380000,
        packPrice: 2520000,
        installment: { months: 5, monthlyFeePercent: 4 },
        tiers: [{ minQty: 1, maxQty: null, unitPrice: 2520000 }],
      },
      specs: [],
      images: [
        {
          imageKey: 'coca-cola-6pk',
          altFa: 'کوکاکولا',
          altEn: 'Coca-Cola',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      productionDate: null,
      expiryDate: null,
      catalogKey: 'coke-1.5l-6pk',
      sortOrder: 2,
    }),
    restore(3, {
      seller,
      category: {
        id: 4,
        slug: 'snacks',
        nameFa: 'تنقلات',
        nameEn: 'Snacks',
        parentId: 1,
      },
      slug: 'cheetoz-cheese',
      nameFa: 'چیپس چیزوز پنیری',
      nameEn: 'Cheetoz Cheese Chips',
      shortDescriptionFa: '۱۰۰ گرم',
      shortDescriptionEn: '100g',
      descriptionFa: null,
      descriptionEn: null,
      brand: 'Cheetoz',
      sku: 'CHEETOZ-100',
      quantity: 0,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      retailPrice: 89000,
      compareAtPrice: 110000,
      discountPercent: 20,
      wholesale: null,
      specs: [],
      images: [
        {
          imageKey: 'cheetoz-cheese',
          altFa: 'چیزوز',
          altEn: 'Cheetoz',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      productionDate: null,
      expiryDate: null,
      catalogKey: 'cheetoz-cheese-100',
      sortOrder: 3,
    }),
    restore(4, {
      seller,
      category: {
        id: 4,
        slug: 'snacks',
        nameFa: 'تنقلات',
        nameEn: 'Snacks',
        parentId: 1,
      },
      slug: 'chips-classic',
      nameFa: 'چیپس سیب‌زمینی کلاسیک',
      nameEn: 'Classic Potato Chips',
      shortDescriptionFa: '۱۴۰ گرم',
      shortDescriptionEn: '140g',
      descriptionFa: null,
      descriptionEn: null,
      brand: 'Vira',
      sku: 'CHIPS-140',
      quantity: 45,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      retailPrice: 75000,
      compareAtPrice: null,
      discountPercent: 0,
      wholesale: null,
      specs: [],
      images: [
        {
          imageKey: 'chips-classic',
          altFa: 'چیپس',
          altEn: 'Chips',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      productionDate: null,
      expiryDate: null,
      catalogKey: null,
      sortOrder: 4,
    }),
    restore(5, {
      seller,
      category: {
        id: 15,
        slug: 'chicken',
        nameFa: 'مرغ',
        nameEn: 'Chicken',
        parentId: 3,
      },
      slug: 'chicken-breast-1kg',
      nameFa: 'سینه مرغ تازه',
      nameEn: 'Fresh Chicken Breast',
      shortDescriptionFa: '۱ کیلوگرم',
      shortDescriptionEn: '1 kilogram',
      descriptionFa: null,
      descriptionEn: null,
      brand: 'Pouya',
      sku: 'CHK-BR-1',
      quantity: 25,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      retailPrice: 420000,
      compareAtPrice: 450000,
      discountPercent: 10,
      wholesale: {
        moq: 2,
        maxQty: 30,
        packMultiple: 1,
        cashPrice: 400000,
        packPrice: 420000,
        installment: null,
        tiers: [{ minQty: 2, maxQty: null, unitPrice: 400000 }],
      },
      specs: [],
      images: [
        {
          imageKey: 'chicken-breast-1kg',
          altFa: 'سینه مرغ',
          altEn: 'Chicken breast',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      productionDate: null,
      expiryDate: null,
      catalogKey: 'chicken-breast-1kg',
      sortOrder: 5,
    }),
    restore(6, {
      seller,
      category: {
        id: 10,
        slug: 'bread',
        nameFa: 'نان',
        nameEn: 'Bread',
        parentId: 2,
      },
      slug: 'barbari-bread',
      nameFa: 'نان بربری تازه',
      nameEn: 'Fresh Barbari Bread',
      shortDescriptionFa: null,
      shortDescriptionEn: null,
      descriptionFa: null,
      descriptionEn: null,
      brand: 'Vira Bakery',
      sku: 'BREAD-BAR',
      quantity: 60,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      retailPrice: 35000,
      compareAtPrice: null,
      discountPercent: 0,
      wholesale: null,
      specs: [],
      images: [
        {
          imageKey: 'barbari-bread',
          altFa: 'نان',
          altEn: 'Bread',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      productionDate: null,
      expiryDate: null,
      catalogKey: null,
      sortOrder: 6,
    }),
    restore(99, {
      seller,
      category: {
        id: 18,
        slug: 'soda',
        nameFa: 'نوشابه',
        nameEn: 'Soda',
        parentId: 7,
      },
      slug: 'draft-soda',
      nameFa: 'نوشابه پیش‌نویس',
      nameEn: 'Draft Soda',
      shortDescriptionFa: null,
      shortDescriptionEn: null,
      descriptionFa: null,
      descriptionEn: null,
      brand: null,
      sku: null,
      quantity: 10,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      retailPrice: 100000,
      compareAtPrice: null,
      discountPercent: 0,
      wholesale: null,
      specs: [],
      images: [],
      productionDate: null,
      expiryDate: null,
      catalogKey: null,
      sortOrder: 99,
      status: ProductStatus.DRAFT,
      published: false,
    }),
  ];
}

export default class InMemoryProductRepository implements ProductRepositoryPort {
  constructor(private readonly items: Product[] = seedProducts()) {}

  listPublished(
    filter: ListPublishedProductsFilter,
  ): Promise<PublishedProductPage> {
    let visible = this.publicItems();
    if (filter.categoryId !== undefined) {
      visible = visible.filter(
        (product) => product.getCategory().id === filter.categoryId,
      );
    }
    if (filter.categorySlug) {
      visible = visible.filter(
        (product) => product.getCategory().slug === filter.categorySlug,
      );
    }
    if (filter.query) {
      const needle = filter.query.toLowerCase();
      visible = visible.filter(
        (product) =>
          product.getNameFa().includes(filter.query!) ||
          product.getNameEn().toLowerCase().includes(needle) ||
          product.getSlug().includes(needle) ||
          (product.getBrand()?.toLowerCase().includes(needle) ?? false),
      );
    }
    if (filter.minPrice !== undefined) {
      visible = visible.filter(
        (product) => product.getRetailPrice() >= filter.minPrice!,
      );
    }
    if (filter.maxPrice !== undefined) {
      visible = visible.filter(
        (product) => product.getRetailPrice() <= filter.maxPrice!,
      );
    }

    visible = this.sort(visible, filter.sort);
    const total = visible.length;
    const offset = (filter.page - 1) * filter.limit;
    return Promise.resolve({
      items: visible.slice(offset, offset + filter.limit),
      total,
    });
  }

  findPublishedBySlug(slug: string): Promise<Product | null> {
    return Promise.resolve(
      this.publicItems().find((product) => product.getSlug() === slug) ?? null,
    );
  }

  findPublishedRelated(product: Product, limit: number): Promise<Product[]> {
    const sameCategory = this.publicItems().filter(
      (item) =>
        item.getId() !== product.getId() &&
        item.getCategory().id === product.getCategory().id,
    );
    const items = [...sameCategory];
    const parentId = product.getCategory().parentId;
    if (items.length < 3 && parentId !== null) {
      const extras = this.publicItems().filter(
        (item) =>
          item.getId() !== product.getId() &&
          !items.some((existing) => existing.getId() === item.getId()) &&
          (item.getCategory().id === parentId ||
            item.getCategory().parentId === parentId),
      );
      items.push(...extras);
    }
    return Promise.resolve(
      items
        .sort(
          (left, right) =>
            left.getSortOrder() - right.getSortOrder() ||
            left.getId() - right.getId(),
        )
        .slice(0, limit),
    );
  }

  countPublishedByCategoryIds(
    categoryIds: number[],
  ): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    for (const product of this.publicItems()) {
      const categoryId = product.getCategory().id;
      if (!categoryIds.includes(categoryId)) {
        continue;
      }
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    }
    return Promise.resolve(counts);
  }

  private publicItems(): Product[] {
    return this.items.filter((product) => product.isPubliclyVisible());
  }

  private sort(items: Product[], sort: ProductSort): Product[] {
    const copy = [...items];
    if (sort === ProductSort.NEWEST) {
      return copy.sort(
        (left, right) =>
          (right.getUpdatedAt()?.getTime() ?? 0) -
            (left.getUpdatedAt()?.getTime() ?? 0) ||
          right.getId() - left.getId(),
      );
    }
    if (sort === ProductSort.CHEAPEST) {
      return copy.sort(
        (left, right) =>
          left.getRetailPrice() - right.getRetailPrice() ||
          left.getId() - right.getId(),
      );
    }
    return copy.sort(
      (left, right) =>
        left.getSortOrder() - right.getSortOrder() ||
        left.getId() - right.getId(),
    );
  }
}
