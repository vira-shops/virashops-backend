export type ProductImageProps = {
  imageKey: string;
  altFa: string | null;
  altEn: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type ProductSpecProps = {
  key: string;
  labelFa: string;
  labelEn: string;
  valueFa: string;
  valueEn: string;
};

export type ProductPriceTierProps = {
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
};

export type ProductInstallmentProps = {
  months: number;
  monthlyFeePercent: number;
};

export type ProductWholesaleProps = {
  moq: number;
  maxQty: number | null;
  packMultiple: number;
  cashPrice: number | null;
  packPrice: number | null;
  installment: ProductInstallmentProps | null;
  tiers: ProductPriceTierProps[];
};

export type ProductSellerProps = {
  id: number;
  shopName: string;
  logoKey: string | null;
};

export type ProductCategoryProps = {
  id: number;
  slug: string;
  nameFa: string;
  nameEn: string;
  parentId: number | null;
};
