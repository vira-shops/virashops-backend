import OrderStatus from '../../model/enums/order-status.enum';

export default class ListOrdersQuery {
  constructor(
    readonly userId: number,
    readonly fromDate?: string | null,
    readonly toDate?: string | null,
    readonly status?: OrderStatus | null,
    readonly page = 1,
    readonly limit = 20,
  ) {}
}
