import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import PaymentMethodName from '../../domain/model/enums/payment-method.enum';
import PaymentMethodPort, {
  InitiatePaymentInput,
  InitiatePaymentResult,
} from '../../domain/ports/payment-method.strategy.port';

@Injectable()
export default class ChequePaymentAdapter implements PaymentMethodPort {
  readonly name = PaymentMethodName.CHEQUE;

  supports(channel: 'RETAIL' | 'WHOLESALE'): boolean {
    return channel === 'WHOLESALE';
  }

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return Promise.resolve({
      kind: 'manual',
      providerRef: `cheque-${input.paymentId}-${randomUUID()}`,
    });
  }
}
