import OrderStatus from '../../model/enums/order-status.enum';

export default class UpdateSellerOrderStatusCommand {
  constructor(
    readonly sellerId: number,
    readonly orderId: number,
    readonly status: OrderStatus,
  ) {}
}
