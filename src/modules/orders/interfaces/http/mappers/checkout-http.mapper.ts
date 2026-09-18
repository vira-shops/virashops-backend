import CheckoutSession from '../../../domain/model/checkout-session.model';
import Order from '../../../domain/model/order.model';

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

  static orderToResponse(order: Order) {
    return {
      id: order.getId(),
      orderNumber: order.getOrderNumber(),
      sellerId: order.getSellerId(),
      sellerShopName: order.getSellerShopName(),
      status: order.getStatus(),
      paymentStatus: order.getPaymentStatus(),
      address: order.getAddress(),
      shippingMethod: order.getShippingMethod(),
      shippingFee: order.getShippingFee(),
      deliveryDate: order.getDeliveryDate(),
      windowStartHour: order.getWindowStartHour(),
      windowEndHour: order.getWindowEndHour(),
      note: order.getNote(),
      items: order.getItems(),
      summary: {
        goodsTotal: order.getGoodsTotal(),
        commissionTotal: order.getCommissionTotal(),
        prepaymentTotal: order.getPrepaymentTotal(),
        shippingFee: order.getShippingFee(),
        grandTotal: order.getGrandTotal(),
      },
    };
  }
}
