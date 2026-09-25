import { Inject, Injectable } from '@nestjs/common';
import CountUnreadNotificationsUseCase from '../../../../notifications/domain/application/usecases/count-unread-notifications.usecase';
import GetLatestUnreadNotificationUseCase from '../../../../notifications/domain/application/usecases/get-latest-unread-notification.usecase';
import NotificationHttpMapper from '../../../../notifications/interfaces/http/mappers/notification-http.mapper';
import ListOrdersQuery from '../../../../orders/domain/application/queries/list-orders.query';
import ListOrdersUseCase from '../../../../orders/domain/application/usecases/list-orders.usecase';
import type OrderRepositoryPort from '../../../../orders/domain/ports/order.repository.port';
import CheckoutHttpMapper from '../../../../orders/interfaces/http/mappers/checkout-http.mapper';
import { ORDER_REPOSITORY } from '../../../../orders/shared/tokens/port.token';
import GetBuyerDashboardQuery from '../queries/get-buyer-dashboard.query';

@Injectable()
export default class GetBuyerDashboardUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepositoryPort,
    private readonly listOrders: ListOrdersUseCase,
    private readonly latestUnread: GetLatestUnreadNotificationUseCase,
    private readonly unreadCount: CountUnreadNotificationsUseCase,
  ) {}

  async execute(query: GetBuyerDashboardQuery) {
    const [counts, recent, banner, unread] = await Promise.all([
      this.orders.countByStatusGroups(query.userId),
      this.listOrders.execute(
        new ListOrdersQuery(query.userId, null, null, null, 1, 5),
      ),
      this.latestUnread.execute(query.userId),
      this.unreadCount.execute(query.userId),
    ]);
    return {
      counts,
      unreadNotifications: unread,
      bannerNotification: banner
        ? NotificationHttpMapper.toResponse(banner)
        : null,
      recentOrders: recent.items.map((order) =>
        CheckoutHttpMapper.orderListToResponse(order),
      ),
    };
  }
}
