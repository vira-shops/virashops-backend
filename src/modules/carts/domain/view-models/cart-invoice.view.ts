export type CartLineView = {
  id: number;
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
  deferredAmount: number;
  totalUnits: number;
};

export type CartInvoiceView = {
  sellerId: number;
  sellerShopName: string;
  sellerLogoKey: string | null;
  items: CartLineView[];
  summary: {
    goodsPrice: number;
    commission: number;
    shipping: number;
    prepayment: number;
    yourProfit: number;
    yourProfitPercent: number;
    grandTotal: number;
  };
};

export type CartView = {
  id: number;
  channel: string;
  invoices: CartInvoiceView[];
  summary: {
    goodsPrice: number;
    commission: number;
    shipping: number;
    prepayment: number;
    yourProfit: number;
    yourProfitPercent: number;
    grandTotal: number;
  };
};
