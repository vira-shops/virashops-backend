import ShippingMethodName from '../../../../shipping/domain/model/enums/shipping-method.enum';
import type { CheckoutAddressSnapshot } from '../../../domain/model/checkout-line.snapshot';
import Order from '../../../domain/model/order.model';
import OrderPaymentStatus from '../../../domain/model/enums/order-payment-status.enum';
import OrderStatus from '../../../domain/model/enums/order-status.enum';
import type { OrderItemRow, OrderRow } from '../schema/orders';

export default class OrderMapper {
  static toDomain(order: OrderRow, items: OrderItemRow[]): Order {
    return Order.restore({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      sellerId: order.sellerId,
      sellerShopName: order.sellerShopName,
      checkoutSessionId: order.checkoutSessionId,
      status: order.status as OrderStatus,
      paymentStatus: order.paymentStatus as OrderPaymentStatus,
      address: order.address as CheckoutAddressSnapshot,
      shippingMethod: order.shippingMethod as ShippingMethodName,
      shippingFee: order.shippingFee,
      deliveryDate: order.deliveryDate,
      windowStartHour: order.windowStartHour,
      windowEndHour: order.windowEndHour,
      note: order.note,
      goodsTotal: order.goodsTotal,
      commissionTotal: order.commissionTotal,
      prepaymentTotal: order.prepaymentTotal,
      grandTotal: order.grandTotal,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productNameFa: item.productNameFa,
        productNameEn: item.productNameEn,
        imageKey: item.imageKey,
        packQty: item.packQty,
        pieceQty: item.pieceQty,
        packMultiple: item.packMultiple,
        unitPrice: item.unitPrice,
        packPrice: item.packPrice,
        commissionPercent: item.commissionPercent,
        commissionAmount: item.commissionAmount,
        prepaymentAmount: item.prepaymentAmount,
        goodsAmount: item.goodsAmount,
        lineTotal: item.lineTotal,
        totalUnits: item.totalUnits,
      })),
    });
  }
}
