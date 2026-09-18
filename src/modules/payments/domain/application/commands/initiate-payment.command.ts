import PaymentMethodName from '../../model/enums/payment-method.enum';

export default class InitiatePaymentCommand {
  constructor(
    readonly userId: number,
    readonly checkoutSessionId: number,
    readonly method: PaymentMethodName,
    readonly callbackUrl: string,
  ) {}
}
