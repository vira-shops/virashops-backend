import ShippingMethodName from '../../../../shipping/domain/model/enums/shipping-method.enum';

export default class StartCheckoutCommand {
  constructor(
    readonly userId: number,
    readonly sellerId: number,
    readonly addressId: number,
    readonly shippingMethod: ShippingMethodName,
    readonly deliveryDate: string,
    readonly windowStartHour: number,
    readonly windowEndHour: number,
    readonly note: string | null,
  ) {}
}
