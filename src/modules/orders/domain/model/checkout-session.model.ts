import { createHash } from 'crypto';
import ShippingMethodName from '../../../shipping/domain/model/enums/shipping-method.enum';
import CheckoutNotPayableError from '../errors/checkout-not-payable.error';
import InvalidCheckoutFieldError from '../errors/invalid-checkout-field.error';
import type {
  CheckoutAddressSnapshot,
  CheckoutLineSnapshot,
} from './checkout-line.snapshot';
import CheckoutSessionStatus from './enums/checkout-session-status.enum';

export type CheckoutSessionProps = {
  id: number | null;
  userId: number;
  sellerId: number;
  sellerShopName: string;
  sellerLogoKey: string | null;
  status: CheckoutSessionStatus;
  address: CheckoutAddressSnapshot;
  shippingMethod: ShippingMethodName;
  shippingFee: number;
  deliveryDate: string;
  windowStartHour: number;
  windowEndHour: number;
  note: string | null;
  lines: CheckoutLineSnapshot[];
  linesHash: string;
  goodsTotal: number;
  commissionTotal: number;
  prepaymentTotal: number;
  payableAmount: number;
  orderId: number | null;
};

export default class CheckoutSession {
  private constructor(private props: CheckoutSessionProps) {}

  static create(
    input: Omit<
      CheckoutSessionProps,
      | 'id'
      | 'status'
      | 'orderId'
      | 'linesHash'
      | 'goodsTotal'
      | 'commissionTotal'
      | 'prepaymentTotal'
      | 'payableAmount'
    > & {
      id?: number | null;
      status?: CheckoutSessionStatus;
      orderId?: number | null;
    },
  ): CheckoutSession {
    const linesHash = CheckoutSession.hashLines(input.lines);
    const goodsTotal = input.lines.reduce((s, l) => s + l.goodsAmount, 0);
    const commissionTotal = input.lines.reduce(
      (s, l) => s + l.commissionAmount,
      0,
    );
    const prepaymentTotal = input.lines.reduce(
      (s, l) => s + l.prepaymentAmount,
      0,
    );
    const payableAmount = prepaymentTotal + input.shippingFee;
    return new CheckoutSession(
      CheckoutSession.validated({
        ...input,
        id: input.id ?? null,
        status: input.status ?? CheckoutSessionStatus.AWAITING_PAYMENT,
        orderId: input.orderId ?? null,
        linesHash,
        goodsTotal,
        commissionTotal,
        prepaymentTotal,
        payableAmount,
      }),
    );
  }

  static restore(props: CheckoutSessionProps): CheckoutSession {
    return new CheckoutSession(CheckoutSession.validated(props));
  }

  static hashLines(lines: CheckoutLineSnapshot[]): string {
    return createHash('sha256').update(JSON.stringify(lines)).digest('hex');
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Checkout session has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
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

  getSellerLogoKey(): string | null {
    return this.props.sellerLogoKey;
  }

  getStatus(): CheckoutSessionStatus {
    return this.props.status;
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

  getLines(): CheckoutLineSnapshot[] {
    return this.props.lines.map((line) => ({ ...line }));
  }

  getLinesHash(): string {
    return this.props.linesHash;
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

  getPayableAmount(): number {
    return this.props.payableAmount;
  }

  getOrderId(): number | null {
    return this.props.orderId;
  }

  assertPayable(): void {
    if (this.props.status !== CheckoutSessionStatus.AWAITING_PAYMENT) {
      throw new CheckoutNotPayableError();
    }
    if (this.props.payableAmount <= 0) {
      throw new CheckoutNotPayableError('Payable amount must be positive');
    }
  }

  markPaid(orderId: number): void {
    this.assertPayable();
    this.props.status = CheckoutSessionStatus.PAID;
    this.props.orderId = orderId;
  }

  toSnapshot(): CheckoutSessionProps {
    return {
      ...this.props,
      address: { ...this.props.address },
      lines: this.getLines(),
    };
  }

  private static validated(props: CheckoutSessionProps): CheckoutSessionProps {
    if (!props.lines.length) {
      throw new InvalidCheckoutFieldError(
        'Checkout requires at least one line',
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(props.deliveryDate)) {
      throw new InvalidCheckoutFieldError('Invalid delivery date');
    }
    if (
      !Number.isInteger(props.windowStartHour) ||
      !Number.isInteger(props.windowEndHour) ||
      props.windowStartHour < 0 ||
      props.windowEndHour > 24 ||
      props.windowStartHour >= props.windowEndHour
    ) {
      throw new InvalidCheckoutFieldError('Invalid delivery window');
    }
    if (!Number.isInteger(props.shippingFee) || props.shippingFee < 0) {
      throw new InvalidCheckoutFieldError('Invalid shipping fee');
    }
    return props;
  }
}
