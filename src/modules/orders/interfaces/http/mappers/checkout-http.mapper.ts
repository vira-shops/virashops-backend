import CheckoutSession from '../../../domain/model/checkout-session.model';
import Order from '../../../domain/model/order.model';

const LIST_THUMBNAIL_LIMIT = 3;

export default class CheckoutHttpMapper {
  static sessionToResponse(session: CheckoutSession) {
    return {
      id: session.getId(),
      sellerId: session.getSellerId(),
      sellerShopName: session.getSellerShopName(),
      sellerLogoKey: session.getSellerLogoKey(),
      status: session.getStatus(),
      address: session.getAddress(),
      shippingMethod: session.getShippingMethod(),
      shippingFee: session.getShippingFee(),
      deliveryDate: session.getDeliveryDate(),
      windowStartHour: session.getWindowStartHour(),
      windowEndHour: session.getWindowEndHour(),
      note: session.getNote(),
      lines: session.getLines(),
      summary: {
        goodsTotal: session.getGoodsTotal(),
        commissionTotal: session.getCommissionTotal(),
        prepaymentTotal: session.getPrepaymentTotal(),
        shippingFee: session.getShippingFee(),
        payableAmount: session.getPayableAmount(),
      },
      orderId: session.getOrderId(),
    };
  }

  /** Figma orders table row: tracking, amount, item thumbs, payment status, date */
  static orderListToResponse(order: Order) {
    const items = order.getItems();
    const imageKeys = items
      .map((item) => item.imageKey)
      .filter((key): key is string => Boolean(key));
    const previewKeys = imageKeys.slice(0, LIST_THUMBNAIL_LIMIT);
    const extraCount = Math.max(0, items.length - previewKeys.length);

    return {
      id: order.getId(),
      orderNumber: order.getOrderNumber(),
      amount: order.getGrandTotal(),
      paymentStatus: order.getPaymentStatus(),
      createdAt: order.getCreatedAt()?.toISOString() ?? null,
      items: {
        imageKeys: previewKeys,
        extraCount,
        totalCount: items.length,
      },
    };
  }

  static orderToResponse(order: Order) {
    const address = order.getAddress();
    const addressLine = [
      address.province,
      address.city,
      address.line1,
      address.line2,
    ]
      .filter(Boolean)
      .join(' - ');

    return {
      id: order.getId(),
      orderNumber: order.getOrderNumber(),
      paymentMethod: order.getPaymentMethod(),
      shippingMethod: order.getShippingMethod(),
      shippingFee: order.getShippingFee(),
      priceTotal: order.getPriceTotal(),
      priceAfterDiscount: order.getPriceAfterDiscount(),
      discountTotal: order.getDiscountTotal(),
      status: order.getStatus(),
      paymentStatus: order.getPaymentStatus(),
      createdAt: order.getCreatedAt()?.toISOString() ?? null,
      receiver: {
        fullName: address.recipientFullName,
        phone: address.recipientPhone,
        nationalId: address.nationalId,
        postalCode: address.postalCode,
        houseNumber: address.houseNumber,
        address: addressLine,
      },
      items: order.getItems().map((item) => ({
        productId: item.productId,
        productNameFa: item.productNameFa,
        productNameEn: item.productNameEn,
        imageKey: item.imageKey,
        unitPrice: item.unitPrice,
        quantity: item.totalUnits,
        lineTotal: item.lineTotal,
        packQty: item.packQty,
        pieceQty: item.pieceQty,
        packMultiple: item.packMultiple,
        packPrice: item.packPrice,
        commissionPercent: item.commissionPercent,
        commissionAmount: item.commissionAmount,
        prepaymentAmount: item.prepaymentAmount,
        goodsAmount: item.goodsAmount,
        totalUnits: item.totalUnits,
      })),
      // extras (checkout / seller context)
      sellerId: order.getSellerId(),
      sellerShopName: order.getSellerShopName(),
      address,
      deliveryDate: order.getDeliveryDate(),
      windowStartHour: order.getWindowStartHour(),
      windowEndHour: order.getWindowEndHour(),
      note: order.getNote(),
      summary: {
        goodsTotal: order.getGoodsTotal(),
        commissionTotal: order.getCommissionTotal(),
        prepaymentTotal: order.getPrepaymentTotal(),
        shippingFee: order.getShippingFee(),
        priceTotal: order.getPriceTotal(),
        discountTotal: order.getDiscountTotal(),
        priceAfterDiscount: order.getPriceAfterDiscount(),
        grandTotal: order.getGrandTotal(),
      },
    };
  }
}
