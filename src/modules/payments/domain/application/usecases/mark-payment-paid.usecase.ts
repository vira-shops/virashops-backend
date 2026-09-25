import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import MaterializeOrderFromCheckoutUseCase from '../../../../orders/domain/application/usecases/materialize-order-from-checkout.usecase';
import OrderPaymentMethod from '../../../../orders/domain/model/enums/order-payment-method.enum';
import {
  ORDER_PAID_EVENT,
  type OrderPaidEvent,
} from '../../../../notifications/shared/events/order-paid.event';
import PaymentMethodName from '../../model/enums/payment-method.enum';
import PaymentStatus from '../../model/enums/payment-status.enum';
import PaymentNotFoundError from '../../errors/payment-not-found.error';
import PaymentNotPayableError from '../../errors/payment-not-payable.error';
import type PaymentRepositoryPort from '../../ports/payment.repository.port';
import { PAYMENT_REPOSITORY } from '../../../shared/tokens/port.token';
import MarkPaymentPaidCommand from '../commands/mark-payment-paid.command';

const MANUAL_METHODS = new Set<PaymentMethodName>([
  PaymentMethodName.CHEQUE,
  PaymentMethodName.PAYROLL,
  PaymentMethodName.CREDIT_LC,
]);

function toOrderPaymentMethod(method: PaymentMethodName): OrderPaymentMethod {
  switch (method) {
    case PaymentMethodName.ONLINE:
      return OrderPaymentMethod.ONLINE;
    case PaymentMethodName.CHEQUE:
      return OrderPaymentMethod.CHEQUE;
    case PaymentMethodName.PAYROLL:
      return OrderPaymentMethod.PAYROLL;
    case PaymentMethodName.CREDIT_LC:
      return OrderPaymentMethod.CREDIT_LC;
    default:
      return OrderPaymentMethod.ONLINE;
  }
}

@Injectable()
export default class MarkPaymentPaidUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepositoryPort,
    private readonly materializeOrder: MaterializeOrderFromCheckoutUseCase,
    private readonly events: EventEmitter2,
  ) {}

  async execute(command: MarkPaymentPaidCommand) {
    const payment = await this.payments.findByIdForUser(
      command.paymentId,
      command.userId,
    );
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    if (MANUAL_METHODS.has(payment.getMethod())) {
      throw new PaymentNotPayableError(
        'Manual payment methods require admin review and cannot be marked paid by the buyer',
      );
    }
    if (
      payment.getOrderId() !== null &&
      payment.getStatus() === PaymentStatus.PAID
    ) {
      return {
        paymentId: payment.getId(),
        orderId: payment.getOrderId(),
        status: payment.getStatus(),
      };
    }
    const order = await this.materializeOrder.execute(
      payment.getCheckoutSessionId(),
      command.userId,
      toOrderPaymentMethod(payment.getMethod()),
    );
    payment.markPaid(order.getId());
    const saved = await this.payments.save(payment);
    const payload: OrderPaidEvent = {
      userId: command.userId,
      sellerId: order.getSellerId(),
      orderId: order.getId(),
      orderNumber: order.getOrderNumber(),
    };
    this.events.emit(ORDER_PAID_EVENT, payload);
    return {
      paymentId: saved.getId(),
      orderId: order.getId(),
      orderNumber: order.getOrderNumber(),
      status: saved.getStatus(),
    };
  }
}
