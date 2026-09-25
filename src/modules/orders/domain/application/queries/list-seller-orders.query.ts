import OrderStatus from '../../model/enums/order-status.enum';

export default class ListSellerOrdersQuery {
  constructor(
    readonly sellerId: number,
    readonly fromDate: string | null,
    readonly toDate: string | null,
    readonly status: OrderStatus | null,
    readonly page: number,
    readonly limit: number,
  ) {}
}
