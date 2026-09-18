import { Inject, Injectable } from '@nestjs/common';
import PaymentMethodUnavailableError from '../../errors/payment-method-unavailable.error';
import PaymentMethodName from '../../model/enums/payment-method.enum';
import type PaymentMethodPort from '../../ports/payment-method.strategy.port';
import { PAYMENT_METHODS } from '../../../shared/tokens/port.token';

@Injectable()
export default class PaymentMethodRegistry {
  private readonly byKey = new Map<string, PaymentMethodPort>();

  constructor(
    @Inject(PAYMENT_METHODS)
    strategies: PaymentMethodPort[],
  ) {
    for (const strategy of strategies) {
      const key = strategy.psp
        ? `${strategy.name}:${strategy.psp}`
        : strategy.name;
      if (this.byKey.has(key)) {
        throw new Error(`Duplicate payment method: ${key}`);
      }
      this.byKey.set(key, strategy);
    }
  }

  get(name: PaymentMethodName, psp?: string): PaymentMethodPort {
    const key =
      name === PaymentMethodName.ONLINE ? `ONLINE:${psp ?? 'STUB'}` : name;
    const found = this.byKey.get(key) ?? this.byKey.get(name);
    if (!found) {
      throw new PaymentMethodUnavailableError();
    }
    return found;
  }

  listAvailable(channel: 'RETAIL' | 'WHOLESALE'): PaymentMethodPort[] {
    return [...this.byKey.values()].filter((s) => s.supports(channel));
  }
}
