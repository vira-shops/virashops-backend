import PaymentMethodName from '../model/enums/payment-method.enum';

export type InitiatePaymentInput = {
  paymentId: number;
  checkoutSessionId: number;
  amount: number;
  callbackUrl: string;
  description?: string;
};

export type InitiatePaymentResult =
  | { kind: 'redirect'; providerRef: string; redirectUrl: string }
  | { kind: 'manual'; providerRef: string }
  | { kind: 'captured'; providerRef: string };

export default interface PaymentMethodPort {
  readonly name: PaymentMethodName;
  readonly psp?: string;
  supports(channel: 'RETAIL' | 'WHOLESALE'): boolean;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
}
