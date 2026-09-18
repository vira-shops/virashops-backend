import ShippingMethodName from '../../../../shipping/domain/model/enums/shipping-method.enum';
import CheckoutSession from '../../../domain/model/checkout-session.model';
import type {
  CheckoutAddressSnapshot,
  CheckoutLineSnapshot,
} from '../../../domain/model/checkout-line.snapshot';
import CheckoutSessionStatus from '../../../domain/model/enums/checkout-session-status.enum';
import type { CheckoutSessionRow } from '../schema/orders';

export default class CheckoutSessionMapper {
  static toDomain(row: CheckoutSessionRow): CheckoutSession {
    return CheckoutSession.restore({
      id: row.id,
      userId: row.userId,
      sellerId: row.sellerId,
      sellerShopName: row.sellerShopName,
      sellerLogoKey: row.sellerLogoKey,
      status: row.status as CheckoutSessionStatus,
      address: row.address as CheckoutAddressSnapshot,
      shippingMethod: row.shippingMethod as ShippingMethodName,
      shippingFee: row.shippingFee,
      deliveryDate: row.deliveryDate,
      windowStartHour: row.windowStartHour,
      windowEndHour: row.windowEndHour,
      note: row.note,
      lines: row.lines as CheckoutLineSnapshot[],
      linesHash: row.linesHash,
      goodsTotal: row.goodsTotal,
      commissionTotal: row.commissionTotal,
      prepaymentTotal: row.prepaymentTotal,
      payableAmount: row.payableAmount,
      orderId: row.orderId,
    });
  }
}
