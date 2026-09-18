import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import PaymentMethodName from '../../domain/model/enums/payment-method.enum';
import PaymentMethodPort, {
  InitiatePaymentInput,
  InitiatePaymentResult,
} from '../../domain/ports/payment-method.strategy.port';

@Injectable()
export default class PayrollPaymentAdapter implements PaymentMethodPort {
  readonly name = PaymentMethodName.PAYROLL;

  supports(channel: 'RETAIL' | 'WHOLESALE'): boolean {
    return channel === 'WHOLESALE';
  }

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return Promise.resolve({
      kind: 'manual',
      providerRef: `payroll-${input.paymentId}-${randomUUID()}`,
    });
  }
}
