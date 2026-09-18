export type CheckoutLineSnapshot = {
  productId: number;
  productNameFa: string;
  productNameEn: string;
  imageKey: string | null;
  packQty: number;
  pieceQty: number;
  packMultiple: number;
  unitPrice: number;
  packPrice: number;
  commissionPercent: number;
  commissionAmount: number;
  prepaymentAmount: number;
  goodsAmount: number;
  lineTotal: number;
  totalUnits: number;
};

export type CheckoutAddressSnapshot = {
  id: number;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
};
