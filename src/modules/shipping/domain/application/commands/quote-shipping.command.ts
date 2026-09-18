import ShippingMethodName from '../../model/enums/shipping-method.enum';

export default class QuoteShippingCommand {
  constructor(
    readonly userId: number,
    readonly sellerId: number,
    readonly addressId: number,
    readonly method: ShippingMethodName,
  ) {}
}
