import type CatalogChannel from '../model/enums/catalog-channel.enum';
import type StockStatus from '../model/enums/stock-status.enum';
import type {
  ProductInstallmentProps,
  ProductPriceTierProps,
} from '../model/product.types';

export type ProductSellerView = {
  id: number;
  shopName: string;
  logoKey: string | null;
};

export type ProductCategoryView = {
  id: number;
  slug: string;
  name: string;
};

export type ProductSpecView = {
  key: string;
  label: string;
  value: string;
};

export type ProductImageView = {
  imageKey: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type ProductWholesaleView = {
  moq: number;
  maxQty: number | null;
  packMultiple: number;
  cashPrice: number | null;
  packPrice: number | null;
  installment: ProductInstallmentProps | null;
  tiers: ProductPriceTierProps[];
};

export type ProductCardView = {
  id: number;
  slug: string;
  name: string;
  imageKey: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  badges: string[];
  stockStatus: StockStatus;
  seller: ProductSellerView;
  storeCount: number;
  channel: CatalogChannel;
};

export type ProductDetailView = ProductCardView & {
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  sku: string | null;
  gallery: ProductImageView[];
  specs: ProductSpecView[];
  productionDate: string | null;
  expiryDate: string | null;
  category: ProductCategoryView;
  wholesale: ProductWholesaleView | null;
  related: ProductCardView[];
};

export type ProductPageView = {
  items: ProductCardView[];
  total: number;
  page: number;
  limit: number;
};
