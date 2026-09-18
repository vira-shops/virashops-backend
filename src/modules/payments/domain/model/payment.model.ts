import PaymentNotPayableError from '../errors/payment-not-payable.error';
import PaymentMethodName from './enums/payment-method.enum';
import PaymentStatus from './enums/payment-status.enum';
import type { InitiatePaymentResult } from '../ports/payment-method.strategy.port';

export type PaymentProps = {
  id: number | null;
  userId: number;
  checkoutSessionId: number;
  orderId: number | null;
  method: PaymentMethodName;
  amount: number;
  status: PaymentStatus;
  providerRef: string | null;
  redirectUrl: string | null;
  bankAccountValidationId: number | null;
};

export default class Payment {
  private constructor(private props: PaymentProps) {}

  static createPending(input: {
    userId: number;
    checkoutSessionId: number;
    method: PaymentMethodName;
    amount: number;
    bankAccountValidationId?: number | null;
  }): Payment {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new PaymentNotPayableError('Amount must be a positive integer');
    }
    return new Payment({
      id: null,
      userId: input.userId,
      checkoutSessionId: input.checkoutSessionId,
      orderId: null,
      method: input.method,
      amount: input.amount,
      status: PaymentStatus.PENDING,
      providerRef: null,
      redirectUrl: null,
      bankAccountValidationId: input.bankAccountValidationId ?? null,
    });
  }

  static restore(props: PaymentProps): Payment {
    return new Payment({
      ...props,
      bankAccountValidationId: props.bankAccountValidationId ?? null,
    });
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Payment has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getCheckoutSessionId(): number {
    return this.props.checkoutSessionId;
  }

  getOrderId(): number | null {
    return this.props.orderId;
  }

  getMethod(): PaymentMethodName {
    return this.props.method;
  }

  getAmount(): number {
    return this.props.amount;
  }

  getStatus(): PaymentStatus {
    return this.props.status;
  }

  getProviderRef(): string | null {
    return this.props.providerRef;
  }

  getRedirectUrl(): string | null {
    return this.props.redirectUrl;
  }

  getBankAccountValidationId(): number | null {
    return this.props.bankAccountValidationId;
  }

  applyInitiation(result: InitiatePaymentResult): void {
    this.props.providerRef = result.providerRef;
    if (result.kind === 'redirect') {
      this.props.redirectUrl = result.redirectUrl;
      this.props.status = PaymentStatus.REDIRECTED;
      return;
    }
    if (result.kind === 'captured') {
      this.props.status = PaymentStatus.PAID;
      return;
    }
    this.props.status = PaymentStatus.PENDING;
  }

  markPaid(orderId: number): void {
    if (this.props.status === PaymentStatus.PAID) {
      this.props.orderId = orderId;
      return;
    }
    if (
      this.props.status !== PaymentStatus.PENDING &&
      this.props.status !== PaymentStatus.REDIRECTED
    ) {
      throw new PaymentNotPayableError();
    }
    this.props.status = PaymentStatus.PAID;
    this.props.orderId = orderId;
  }

  toSnapshot(): PaymentProps {
    return { ...this.props };
  }
}
