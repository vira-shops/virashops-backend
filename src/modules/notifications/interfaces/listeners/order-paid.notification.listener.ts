import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type SellerRepositoryPort from '../../../sellers/domain/ports/seller.repository.port';
import { SELLER_REPOSITORY } from '../../../sellers/shared/tokens/port.token';
import CreateNotificationCommand from '../../domain/application/commands/create-notification.command';
import CreateNotificationUseCase from '../../domain/application/usecases/create-notification.usecase';
import NotificationPriority from '../../domain/model/enums/notification-priority.enum';
import NotificationType from '../../domain/model/enums/notification-type.enum';
import {
  ORDER_PAID_EVENT,
  type OrderPaidEvent,
} from '../../shared/events/order-paid.event';

@Injectable()
export default class OrderPaidNotificationListener {
  private readonly logger = new Logger(OrderPaidNotificationListener.name);

  constructor(
    private readonly createNotification: CreateNotificationUseCase,
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
  ) {}

  @OnEvent(ORDER_PAID_EVENT)
  async handle(event: OrderPaidEvent): Promise<void> {
    try {
      await this.createNotification.execute(
        new CreateNotificationCommand(
          event.userId,
          NotificationType.ORDER,
          'سفارش شما ثبت شد',
          `سفارش ${event.orderNumber} با موفقیت ثبت شد.`,
          NotificationPriority.NORMAL,
          'ORDER',
          String(event.orderId),
          { orderNumber: event.orderNumber },
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to create buyer order-paid notification for order ${event.orderId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    try {
      const seller = await this.sellers.findById(event.sellerId);
      if (!seller) {
        return;
      }
      await this.createNotification.execute(
        new CreateNotificationCommand(
          seller.getUserId(),
          NotificationType.ORDER,
          'سفارش جدید دریافت شد',
          `سفارش ${event.orderNumber} برای فروشگاه شما ثبت شد.`,
          NotificationPriority.NORMAL,
          'ORDER',
          String(event.orderId),
          { orderNumber: event.orderNumber },
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to create seller order-paid notification for order ${event.orderId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
