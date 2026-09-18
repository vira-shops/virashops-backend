import { Inject, Injectable } from '@nestjs/common';
import MaterializeOrderFromCheckoutUseCase from '../../../../orders/domain/application/usecases/materialize-order-from-checkout.usecase';
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

@Injectable()
export default class MarkPaymentPaidUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepositoryPort,
    private readonly materializeOrder: MaterializeOrderFromCheckoutUseCase,
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
    );
    payment.markPaid(order.getId());
    const saved = await this.payments.save(payment);
    return {
      paymentId: saved.getId(),
      orderId: order.getId(),
      orderNumber: order.getOrderNumber(),
      status: saved.getStatus(),
    };
  }
}
