import { Inject, Injectable } from '@nestjs/common';
import ShippingMethodUnavailableError from '../../errors/shipping-method-unavailable.error';
import ShippingMethodName from '../../model/enums/shipping-method.enum';
import type ShippingMethodPort from '../../ports/shipping-method.strategy.port';
import { SHIPPING_METHODS } from '../../../shared/tokens/port.token';

@Injectable()
export default class ShippingMethodRegistry {
  private readonly byName = new Map<ShippingMethodName, ShippingMethodPort>();

  constructor(
    @Inject(SHIPPING_METHODS)
    strategies: ShippingMethodPort[],
  ) {
    for (const strategy of strategies) {
      if (this.byName.has(strategy.name)) {
        throw new Error(`Duplicate shipping method: ${strategy.name}`);
      }
      this.byName.set(strategy.name, strategy);
    }
  }

  get(name: ShippingMethodName): ShippingMethodPort {
    const found = this.byName.get(name);
    if (!found) {
      throw new ShippingMethodUnavailableError();
    }
    return found;
  }

  list(): ShippingMethodPort[] {
    return [...this.byName.values()];
  }
}
