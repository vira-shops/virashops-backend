import Cart from '../../model/cart.model';
import CartItem from '../../model/cart-item.model';
import type {
  CartInvoiceView,
  CartLineView,
  CartView,
} from '../../view-models/cart-invoice.view';

export default class CartViewFactory {
  static toView(
    cart: Cart,
    shippingBySeller: Map<number, number> = new Map(),
  ): CartView {
    const bySeller = new Map<number, CartItem[]>();
    for (const item of cart.getItems()) {
      const list = bySeller.get(item.getSellerId()) ?? [];
      list.push(item);
      bySeller.set(item.getSellerId(), list);
    }

    const invoices: CartInvoiceView[] = [];
    for (const [sellerId, items] of bySeller) {
      const first = items[0];
      const goodsPrice = items.reduce((s, i) => s + i.goodsAmount(), 0);
      const commission = items.reduce((s, i) => s + i.commissionAmount(), 0);
      const prepayment = items.reduce((s, i) => s + i.getPrepaymentAmount(), 0);
      const shipping = shippingBySeller.get(sellerId) ?? 0;
      const grandTotal = goodsPrice + commission + shipping;
      const yourProfit = commission;
      const yourProfitPercent =
        goodsPrice > 0 ? Math.round((yourProfit / goodsPrice) * 100) : 0;
      invoices.push({
        sellerId,
        sellerShopName: first.getSellerShopName(),
        sellerLogoKey: first.getSellerLogoKey(),
        items: items.map((item) => this.toLine(item)),
        summary: {
          goodsPrice,
          commission,
          shipping,
          prepayment,
          yourProfit,
          yourProfitPercent,
          grandTotal,
        },
      });
    }

    invoices.sort((a, b) => a.sellerId - b.sellerId);

    const goodsPrice = invoices.reduce((s, i) => s + i.summary.goodsPrice, 0);
    const commission = invoices.reduce((s, i) => s + i.summary.commission, 0);
    const shipping = invoices.reduce((s, i) => s + i.summary.shipping, 0);
    const prepayment = invoices.reduce((s, i) => s + i.summary.prepayment, 0);
    const grandTotal = goodsPrice + commission + shipping;
    const yourProfit = commission;
    const yourProfitPercent =
      goodsPrice > 0 ? Math.round((yourProfit / goodsPrice) * 100) : 0;

    return {
      id: cart.getId(),
      channel: cart.getChannel(),
      invoices,
      summary: {
        goodsPrice,
        commission,
        shipping,
        prepayment,
        yourProfit,
        yourProfitPercent,
        grandTotal,
      },
    };
  }

  private static toLine(item: CartItem): CartLineView {
    return {
      id: item.getId(),
      productId: item.getProductId(),
      productNameFa: item.getProductNameFa(),
      productNameEn: item.getProductNameEn(),
      imageKey: item.getImageKey(),
      packQty: item.getPackQty(),
      pieceQty: item.getPieceQty(),
      packMultiple: item.getPackMultiple(),
      unitPrice: item.getUnitPrice(),
      packPrice: item.getPackPrice(),
      commissionPercent: item.getCommissionPercent(),
      commissionAmount: item.commissionAmount(),
      prepaymentAmount: item.getPrepaymentAmount(),
      goodsAmount: item.goodsAmount(),
      lineTotal: item.lineTotal(),
      deferredAmount: item.deferredAmount(),
      totalUnits: item.totalUnits(),
    };
  }
}
