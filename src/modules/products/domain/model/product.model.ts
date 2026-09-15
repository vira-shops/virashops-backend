import InvalidProductFieldError from '../errors/invalid-product-field.error';
import CatalogChannel from './enums/catalog-channel.enum';
import ProductStatus from './enums/product-status.enum';
import StockStatus from './enums/stock-status.enum';
import type {
  ProductCategoryProps,
  ProductImageProps,
  ProductSellerProps,
  ProductSpecProps,
  ProductWholesaleProps,
} from './product.types';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export type ProductProps = {
  id: number | null;
  seller: ProductSellerProps;
  category: ProductCategoryProps;
  slug: string;
  nameFa: string;
  nameEn: string;
  shortDescriptionFa: string | null;
  shortDescriptionEn: string | null;
  descriptionFa: string | null;
  descriptionEn: string | null;
  brand: string | null;
  sku: string | null;
  status: ProductStatus;
  published: boolean;
  quantity: number;
  lowStockThreshold: number;
  retailPrice: number;
  compareAtPrice: number | null;
  discountPercent: number;
  wholesale: ProductWholesaleProps | null;
  specs: ProductSpecProps[];
  images: ProductImageProps[];
  productionDate: string | null;
  expiryDate: string | null;
  catalogKey: string | null;
  sortOrder: number;
  updatedAt: Date | null;
};

export default class Product {
  private constructor(private props: ProductProps) {}

  static create(
    input: Omit<ProductProps, 'id' | 'status' | 'published' | 'updatedAt'> & {
      status?: ProductStatus;
      published?: boolean;
      updatedAt?: Date | null;
    },
  ): Product {
    return new Product(
      Product.validated({
        ...input,
        id: null,
        status: input.status ?? ProductStatus.DRAFT,
        published: input.published ?? false,
        updatedAt: input.updatedAt ?? null,
      }),
    );
  }

  static restore(props: ProductProps): Product {
    return new Product(Product.validated(props));
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Product has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getSeller(): ProductSellerProps {
    return this.props.seller;
  }

  getCategory(): ProductCategoryProps {
    return this.props.category;
  }

  getSlug(): string {
    return this.props.slug;
  }

  getNameFa(): string {
    return this.props.nameFa;
  }

  getNameEn(): string {
    return this.props.nameEn;
  }

  getName(lang: string): string {
    return lang.toLowerCase().startsWith('fa')
      ? this.props.nameFa
      : this.props.nameEn;
  }

  getShortDescription(lang: string): string | null {
    return lang.toLowerCase().startsWith('fa')
      ? this.props.shortDescriptionFa
      : this.props.shortDescriptionEn;
  }

  getDescription(lang: string): string | null {
    return lang.toLowerCase().startsWith('fa')
      ? this.props.descriptionFa
      : this.props.descriptionEn;
  }

  getBrand(): string | null {
    return this.props.brand;
  }

  getSku(): string | null {
    return this.props.sku;
  }

  getStatus(): ProductStatus {
    return this.props.status;
  }

  isPublished(): boolean {
    return this.props.published;
  }

  isPubliclyVisible(): boolean {
    return this.props.status === ProductStatus.ACTIVE && this.props.published;
  }

  getQuantity(): number {
    return this.props.quantity;
  }

  getLowStockThreshold(): number {
    return this.props.lowStockThreshold;
  }

  getStockStatus(): StockStatus {
    if (this.props.quantity <= 0) {
      return StockStatus.OUT_OF_STOCK;
    }
    if (this.props.quantity <= this.props.lowStockThreshold) {
      return StockStatus.LOW_STOCK;
    }
    return StockStatus.IN_STOCK;
  }

  getRetailPrice(): number {
    return this.props.retailPrice;
  }

  getCompareAtPrice(): number | null {
    return this.props.compareAtPrice;
  }

  getDiscountPercent(): number {
    return this.props.discountPercent;
  }

  getWholesale(): ProductWholesaleProps | null {
    return this.props.wholesale;
  }

  hasWholesale(): boolean {
    const wholesale = this.props.wholesale;
    if (!wholesale) {
      return false;
    }
    return (
      wholesale.cashPrice !== null ||
      wholesale.packPrice !== null ||
      wholesale.tiers.length > 0 ||
      wholesale.moq > 1
    );
  }

  getUnitPrice(channel: CatalogChannel): number {
    if (channel === CatalogChannel.WHOLESALE && this.hasWholesale()) {
      const wholesale = this.props.wholesale;
      return (
        wholesale?.cashPrice ??
        wholesale?.tiers[0]?.unitPrice ??
        this.props.retailPrice
      );
    }
    return this.props.retailPrice;
  }

  getSpecs(): ProductSpecProps[] {
    return this.props.specs;
  }

  getImages(): ProductImageProps[] {
    return [...this.props.images].sort(
      (left, right) =>
        Number(right.isPrimary) - Number(left.isPrimary) ||
        left.sortOrder - right.sortOrder,
    );
  }

  getPrimaryImageKey(): string | null {
    return this.getImages()[0]?.imageKey ?? null;
  }

  replaceImages(images: ProductImageProps[]): void {
    if (images.length < 1) {
      throw new InvalidProductFieldError(
        'At least one product image is required',
      );
    }
    const normalized = images.map((image, index) => {
      const imageKey = image.imageKey.trim();
      if (!imageKey) {
        throw new InvalidProductFieldError('Image key is required');
      }
      return {
        imageKey,
        altFa: image.altFa?.trim() || null,
        altEn: image.altEn?.trim() || null,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder ?? index,
      };
    });
    const primaryCount = normalized.filter((image) => image.isPrimary).length;
    if (primaryCount === 0) {
      normalized[0].isPrimary = true;
    } else if (primaryCount > 1) {
      let seenPrimary = false;
      for (const image of normalized) {
        if (image.isPrimary && seenPrimary) {
          image.isPrimary = false;
        } else if (image.isPrimary) {
          seenPrimary = true;
        }
      }
    }
    this.props.images = normalized;
    this.props.updatedAt = new Date();
  }

  getProductionDate(): string | null {
    return this.props.productionDate;
  }

  getExpiryDate(): string | null {
    return this.props.expiryDate;
  }

  getCatalogKey(): string | null {
    return this.props.catalogKey;
  }

  getSortOrder(): number {
    return this.props.sortOrder;
  }

  getUpdatedAt(): Date | null {
    return this.props.updatedAt;
  }

  private static validated(props: ProductProps): ProductProps {
    const slug = props.slug.trim().toLowerCase();
    const nameFa = props.nameFa.trim();
    const nameEn = props.nameEn.trim();
    const shopName = props.seller.shopName.trim();
    const categorySlug = props.category.slug.trim().toLowerCase();
    const categoryNameFa = props.category.nameFa.trim();
    const categoryNameEn = props.category.nameEn.trim();

    if (!SLUG_PATTERN.test(slug)) {
      throw new InvalidProductFieldError('Slug must be URL-safe kebab-case');
    }
    if (!nameFa || !nameEn) {
      throw new InvalidProductFieldError('Product names are required');
    }
    if (props.seller.id <= 0) {
      throw new InvalidProductFieldError('Seller is required');
    }
    if (!shopName) {
      throw new InvalidProductFieldError('Seller shop name is required');
    }
    if (props.category.id <= 0) {
      throw new InvalidProductFieldError('Category is required');
    }
    if (
      !SLUG_PATTERN.test(categorySlug) ||
      !categoryNameFa ||
      !categoryNameEn
    ) {
      throw new InvalidProductFieldError('Category summary is invalid');
    }
    if (props.retailPrice <= 0 || !Number.isInteger(props.retailPrice)) {
      throw new InvalidProductFieldError(
        'Retail price must be a positive integer',
      );
    }
    if (
      props.compareAtPrice !== null &&
      (props.compareAtPrice <= props.retailPrice ||
        !Number.isInteger(props.compareAtPrice))
    ) {
      throw new InvalidProductFieldError(
        'Compare-at price must be greater than the sell price',
      );
    }
    if (
      props.discountPercent < 0 ||
      props.discountPercent > 100 ||
      !Number.isInteger(props.discountPercent)
    ) {
      throw new InvalidProductFieldError(
        'Discount percent must be an integer between 0 and 100',
      );
    }
    if (props.quantity < 0 || !Number.isInteger(props.quantity)) {
      throw new InvalidProductFieldError('Quantity cannot be negative');
    }
    if (
      props.lowStockThreshold < 0 ||
      !Number.isInteger(props.lowStockThreshold)
    ) {
      throw new InvalidProductFieldError(
        'Low-stock threshold cannot be negative',
      );
    }
    if (props.sortOrder < 0) {
      throw new InvalidProductFieldError('Sort order cannot be negative');
    }

    const images = props.images.map((image, index) => {
      const imageKey = image.imageKey.trim();
      if (!imageKey) {
        throw new InvalidProductFieldError('Image key is required');
      }
      return {
        imageKey,
        altFa: image.altFa?.trim() || null,
        altEn: image.altEn?.trim() || null,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder ?? index,
      };
    });

    const specs = props.specs.map((spec) => {
      const key = spec.key.trim();
      if (!key) {
        throw new InvalidProductFieldError('Spec key is required');
      }
      return {
        key,
        labelFa: spec.labelFa.trim(),
        labelEn: spec.labelEn.trim(),
        valueFa: spec.valueFa.trim(),
        valueEn: spec.valueEn.trim(),
      };
    });

    const wholesale = Product.validatedWholesale(props.wholesale);

    return {
      ...props,
      slug,
      nameFa,
      nameEn,
      shortDescriptionFa: props.shortDescriptionFa?.trim() || null,
      shortDescriptionEn: props.shortDescriptionEn?.trim() || null,
      descriptionFa: props.descriptionFa?.trim() || null,
      descriptionEn: props.descriptionEn?.trim() || null,
      brand: props.brand?.trim() || null,
      sku: props.sku?.trim() || null,
      catalogKey: props.catalogKey?.trim() || null,
      productionDate: props.productionDate?.trim() || null,
      expiryDate: props.expiryDate?.trim() || null,
      seller: {
        id: props.seller.id,
        shopName,
        logoKey: props.seller.logoKey?.trim() || null,
      },
      category: {
        id: props.category.id,
        slug: categorySlug,
        nameFa: categoryNameFa,
        nameEn: categoryNameEn,
        parentId: props.category.parentId,
      },
      images,
      specs,
      wholesale,
    };
  }

  private static validatedWholesale(
    wholesale: ProductWholesaleProps | null,
  ): ProductWholesaleProps | null {
    if (!wholesale) {
      return null;
    }
    if (wholesale.moq < 1 || !Number.isInteger(wholesale.moq)) {
      throw new InvalidProductFieldError('MOQ must be a positive integer');
    }
    if (
      wholesale.maxQty !== null &&
      (wholesale.maxQty < wholesale.moq || !Number.isInteger(wholesale.maxQty))
    ) {
      throw new InvalidProductFieldError(
        'Max quantity must be greater than or equal to MOQ',
      );
    }
    if (
      wholesale.packMultiple < 1 ||
      !Number.isInteger(wholesale.packMultiple)
    ) {
      throw new InvalidProductFieldError(
        'Pack multiple must be a positive integer',
      );
    }
    if (
      wholesale.cashPrice !== null &&
      (wholesale.cashPrice <= 0 || !Number.isInteger(wholesale.cashPrice))
    ) {
      throw new InvalidProductFieldError(
        'Cash price must be a positive integer',
      );
    }
    if (
      wholesale.packPrice !== null &&
      (wholesale.packPrice <= 0 || !Number.isInteger(wholesale.packPrice))
    ) {
      throw new InvalidProductFieldError(
        'Pack price must be a positive integer',
      );
    }
    if (wholesale.installment) {
      if (
        wholesale.installment.months < 1 ||
        !Number.isInteger(wholesale.installment.months)
      ) {
        throw new InvalidProductFieldError(
          'Installment months must be a positive integer',
        );
      }
      if (wholesale.installment.monthlyFeePercent < 0) {
        throw new InvalidProductFieldError(
          'Installment fee cannot be negative',
        );
      }
    }
    const tiers = wholesale.tiers.map((tier) => {
      if (tier.minQty < 1 || !Number.isInteger(tier.minQty)) {
        throw new InvalidProductFieldError(
          'Tier min quantity must be a positive integer',
        );
      }
      if (
        tier.maxQty !== null &&
        (tier.maxQty < tier.minQty || !Number.isInteger(tier.maxQty))
      ) {
        throw new InvalidProductFieldError('Tier max quantity is invalid');
      }
      if (tier.unitPrice <= 0 || !Number.isInteger(tier.unitPrice)) {
        throw new InvalidProductFieldError(
          'Tier unit price must be a positive integer',
        );
      }
      return {
        minQty: tier.minQty,
        maxQty: tier.maxQty,
        unitPrice: tier.unitPrice,
      };
    });

    return {
      moq: wholesale.moq,
      maxQty: wholesale.maxQty,
      packMultiple: wholesale.packMultiple,
      cashPrice: wholesale.cashPrice,
      packPrice: wholesale.packPrice,
      installment: wholesale.installment,
      tiers,
    };
  }
}
