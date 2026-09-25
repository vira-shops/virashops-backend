import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
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

  constructor(private readonly createNotification: CreateNotificationUseCase) {}

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
        `Failed to create order-paid notification for order ${event.orderId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
