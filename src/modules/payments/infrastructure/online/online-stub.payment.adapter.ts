import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import PaymentMethodName from '../../domain/model/enums/payment-method.enum';
import PaymentMethodPort, {
  InitiatePaymentInput,
  InitiatePaymentResult,
} from '../../domain/ports/payment-method.strategy.port';

@Injectable()
export default class OnlineStubPaymentAdapter implements PaymentMethodPort {
  readonly name = PaymentMethodName.ONLINE;
  readonly psp = 'STUB';

  constructor(private readonly config: ConfigService) {}

  supports(channel: 'RETAIL' | 'WHOLESALE'): boolean {
    void channel;
    return true;
  }

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const base =
      this.config.get<string>('PAYMENT_STUB_REDIRECT_URL') ??
      'https://pay.stub.local/redirect';
    return Promise.resolve({
      kind: 'redirect',
      providerRef: `stub-${input.paymentId}-${randomUUID()}`,
      redirectUrl: `${base}?paymentId=${input.paymentId}&amount=${input.amount}&callback=${encodeURIComponent(input.callbackUrl)}`,
    });
  }
}
