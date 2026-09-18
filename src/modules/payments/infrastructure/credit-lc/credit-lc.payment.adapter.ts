import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import PaymentMethodName from '../../domain/model/enums/payment-method.enum';
import PaymentMethodPort, {
  InitiatePaymentInput,
  InitiatePaymentResult,
} from '../../domain/ports/payment-method.strategy.port';

@Injectable()
export default class CreditLcPaymentAdapter implements PaymentMethodPort {
  readonly name = PaymentMethodName.CREDIT_LC;

  supports(channel: 'RETAIL' | 'WHOLESALE'): boolean {
    return channel === 'WHOLESALE';
  }

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return Promise.resolve({
      kind: 'manual',
      providerRef: `lc-${input.paymentId}-${randomUUID()}`,
    });
  }
}
