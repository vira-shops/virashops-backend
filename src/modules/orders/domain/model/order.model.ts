import InvalidOrderStatusTransitionError from '../errors/invalid-order-status-transition.error';
import type {
  CheckoutAddressSnapshot,
  CheckoutLineSnapshot,
} from './checkout-line.snapshot';
import OrderPaymentMethod from './enums/order-payment-method.enum';
import OrderPaymentStatus from './enums/order-payment-status.enum';
import OrderStatus from './enums/order-status.enum';
import ShippingMethodName from '../../../shipping/domain/model/enums/shipping-method.enum';

export type OrderItemProps = {
  id: number | null;
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

export type OrderProps = {
  id: number | null;
  orderNumber: string;
  userId: number;
  sellerId: number;
  sellerShopName: string;
  checkoutSessionId: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  address: CheckoutAddressSnapshot;
  shippingMethod: ShippingMethodName;
  shippingFee: number;
  deliveryDate: string;
  windowStartHour: number;
  windowEndHour: number;
  note: string | null;
  goodsTotal: number;
  commissionTotal: number;
  prepaymentTotal: number;
  priceTotal: number;
  discountTotal: number;
  priceAfterDiscount: number;
  grandTotal: number;
  items: OrderItemProps[];
  createdAt: Date | null;
};

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [
    OrderStatus.DELIVERED,
    OrderStatus.RETURNED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.RETURNED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.FAILED]: [],
};

export default class Order {
  private constructor(private props: OrderProps) {}

  static create(
    input: Omit<OrderProps, 'id' | 'createdAt'> & {
      id?: number | null;
      createdAt?: Date | null;
    },
  ): Order {
    return new Order({
      ...input,
      id: input.id ?? null,
      createdAt: input.createdAt ?? null,
    });
  }

  static restore(props: OrderProps): Order {
    return new Order(props);
  }

  static fromCheckoutLines(lines: CheckoutLineSnapshot[]): OrderItemProps[] {
    return lines.map((line) => ({
      id: null,
      productId: line.productId,
      productNameFa: line.productNameFa,
      productNameEn: line.productNameEn,
      imageKey: line.imageKey,
      packQty: line.packQty,
      pieceQty: line.pieceQty,
      packMultiple: line.packMultiple,
      unitPrice: line.unitPrice,
      packPrice: line.packPrice,
      commissionPercent: line.commissionPercent,
      commissionAmount: line.commissionAmount,
      prepaymentAmount: line.prepaymentAmount,
      goodsAmount: line.goodsAmount,
      lineTotal: line.lineTotal,
      totalUnits: line.totalUnits,
    }));
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Order has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getOrderNumber(): string {
    return this.props.orderNumber;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getSellerId(): number {
    return this.props.sellerId;
  }

  getSellerShopName(): string {
    return this.props.sellerShopName;
  }

  getCheckoutSessionId(): number {
    return this.props.checkoutSessionId;
  }

  getStatus(): OrderStatus {
    return this.props.status;
  }

  getPaymentStatus(): OrderPaymentStatus {
    return this.props.paymentStatus;
  }

  getPaymentMethod(): OrderPaymentMethod {
    return this.props.paymentMethod;
  }

  getAddress(): CheckoutAddressSnapshot {
    return this.props.address;
  }

  getShippingMethod(): ShippingMethodName {
    return this.props.shippingMethod;
  }

  getShippingFee(): number {
    return this.props.shippingFee;
  }

  getDeliveryDate(): string {
    return this.props.deliveryDate;
  }

  getWindowStartHour(): number {
    return this.props.windowStartHour;
  }

  getWindowEndHour(): number {
    return this.props.windowEndHour;
  }

  getNote(): string | null {
    return this.props.note;
  }

  getGoodsTotal(): number {
    return this.props.goodsTotal;
  }

  getCommissionTotal(): number {
    return this.props.commissionTotal;
  }

  getPrepaymentTotal(): number {
    return this.props.prepaymentTotal;
  }

  getPriceTotal(): number {
    return this.props.priceTotal;
  }

  getDiscountTotal(): number {
    return this.props.discountTotal;
  }

  getPriceAfterDiscount(): number {
    return this.props.priceAfterDiscount;
  }

  getGrandTotal(): number {
    return this.props.grandTotal;
  }

  getCreatedAt(): Date | null {
    return this.props.createdAt;
  }

  getItems(): OrderItemProps[] {
    return this.props.items.map((item) => ({ ...item }));
  }

  transitionTo(next: OrderStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this.props.status];
    if (!allowed.includes(next)) {
      throw new InvalidOrderStatusTransitionError();
    }
    this.props.status = next;
  }

  toSnapshot(): OrderProps {
    return {
      ...this.props,
      address: { ...this.props.address },
      items: this.getItems(),
    };
  }
}
