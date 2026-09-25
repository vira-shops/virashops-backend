import { Injectable } from '@nestjs/common';
import CountUnreadNotificationsUseCase from '../../../../notifications/domain/application/usecases/count-unread-notifications.usecase';
import GetLatestUnreadNotificationUseCase from '../../../../notifications/domain/application/usecases/get-latest-unread-notification.usecase';
import NotificationHttpMapper from '../../../../notifications/interfaces/http/mappers/notification-http.mapper';
import ListSellerOrdersQuery from '../../../../orders/domain/application/queries/list-seller-orders.query';
import CountSellerOrderStatusesUseCase from '../../../../orders/domain/application/usecases/count-seller-order-statuses.usecase';
import ListSellerOrdersUseCase from '../../../../orders/domain/application/usecases/list-seller-orders.usecase';
import CheckoutHttpMapper from '../../../../orders/interfaces/http/mappers/checkout-http.mapper';
import GetSellerByUserIdQuery from '../../../../sellers/domain/application/queries/get-seller-by-user-id.query';
import GetSellerByUserIdUseCase from '../../../../sellers/domain/application/usecases/get-seller-by-user-id.usecase';
import SellerNotFoundError from '../../../../sellers/domain/errors/seller-not-found.error';
import GetSellerDashboardQuery from '../queries/get-seller-dashboard.query';

@Injectable()
export default class GetSellerDashboardUseCase {
  constructor(
    private readonly getSellerByUserId: GetSellerByUserIdUseCase,
    private readonly countStatuses: CountSellerOrderStatusesUseCase,
    private readonly listOrders: ListSellerOrdersUseCase,
    private readonly latestUnread: GetLatestUnreadNotificationUseCase,
    private readonly unreadCount: CountUnreadNotificationsUseCase,
  ) {}

  async execute(query: GetSellerDashboardQuery) {
    const seller = await this.getSellerByUserId.execute(
      new GetSellerByUserIdQuery(query.userId),
    );
    if (!seller) {
      throw new SellerNotFoundError();
    }
    const [counts, recent, banner, unread] = await Promise.all([
      this.countStatuses.execute(seller.id),
      this.listOrders.execute(
        new ListSellerOrdersQuery(seller.id, null, null, null, 1, 5),
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
