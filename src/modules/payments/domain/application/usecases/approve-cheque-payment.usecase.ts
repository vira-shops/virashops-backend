import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import MaterializeOrderFromCheckoutUseCase from '../../../../orders/domain/application/usecases/materialize-order-from-checkout.usecase';
import OrderPaymentMethod from '../../../../orders/domain/model/enums/order-payment-method.enum';
import {
  ORDER_PAID_EVENT,
  type OrderPaidEvent,
} from '../../../../notifications/shared/events/order-paid.event';
import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import ChequeSubmissionNotFoundError from '../../errors/cheque-submission-not-found.error';
import InvalidChequeFieldError from '../../errors/invalid-cheque-field.error';
import PaymentNotFoundError from '../../errors/payment-not-found.error';
import PaymentMethodName from '../../model/enums/payment-method.enum';
import ChequeVerificationStatus from '../../model/enums/cheque-verification-status.enum';
import PaymentStatus from '../../model/enums/payment-status.enum';
import type ChequeSubmissionRepositoryPort from '../../ports/cheque-submission.repository.port';
import type PaymentRepositoryPort from '../../ports/payment.repository.port';
import {
  CHEQUE_SUBMISSION_REPOSITORY,
  PAYMENT_REPOSITORY,
} from '../../../shared/tokens/port.token';
import type { ChequeSubmissionView } from '../../view-models/cheque-submission.view';
import ApproveChequePaymentCommand from '../commands/approve-cheque-payment.command';
import ChequeSubmissionPresenter from '../services/cheque-submission.presenter';

export type ApproveChequePaymentResult = {
  submission: ChequeSubmissionView;
  paymentId: number;
  orderId: number;
  orderNumber: string;
  status: PaymentStatus;
};

@Injectable()
export default class ApproveChequePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepositoryPort,
    @Inject(CHEQUE_SUBMISSION_REPOSITORY)
    private readonly submissions: ChequeSubmissionRepositoryPort,
    private readonly materializeOrder: MaterializeOrderFromCheckoutUseCase,
    private readonly presenter: ChequeSubmissionPresenter,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    command: ApproveChequePaymentCommand,
  ): Promise<ApproveChequePaymentResult> {
    if (!command.actorRoles.includes(Role.ADMIN)) {
      throw new ForbiddenError();
    }

    const payment = await this.payments.findById(command.paymentId);
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    if (payment.getMethod() !== PaymentMethodName.CHEQUE) {
      throw new InvalidChequeFieldError('Payment is not a cheque payment');
    }

    const submission = await this.submissions.findByPaymentId(payment.getId());
    if (!submission) {
      throw new ChequeSubmissionNotFoundError();
    }

    if (
      payment.getOrderId() !== null &&
      payment.getStatus() === PaymentStatus.PAID &&
      submission.getStatus() === ChequeVerificationStatus.APPROVED
    ) {
      const view = await this.presenter.present({
        paymentId: payment.getId(),
        payableAmount: payment.getAmount(),
        submission,
        order: {
          orderId: payment.getOrderId()!,
          orderNumber: '',
          status: 'PAID',
        },
      });
      return {
        submission: view,
        paymentId: payment.getId(),
        orderId: payment.getOrderId()!,
        orderNumber: '',
        status: payment.getStatus(),
      };
    }

    submission.approve(command.adminUserId);
    const savedSubmission = await this.submissions.save(submission);

    const order = await this.materializeOrder.execute(
      payment.getCheckoutSessionId(),
      payment.getUserId(),
      OrderPaymentMethod.CHEQUE,
    );
    payment.markPaid(order.getId());
    const savedPayment = await this.payments.save(payment);

    const payload: OrderPaidEvent = {
      userId: payment.getUserId(),
      sellerId: order.getSellerId(),
      orderId: order.getId(),
      orderNumber: order.getOrderNumber(),
    };
    this.events.emit(ORDER_PAID_EVENT, payload);

    const view = await this.presenter.present({
      paymentId: savedPayment.getId(),
      payableAmount: savedPayment.getAmount(),
      submission: savedSubmission,
      order: {
        orderId: order.getId(),
        orderNumber: order.getOrderNumber(),
        status: 'PAID',
      },
    });

    return {
      submission: view,
      paymentId: savedPayment.getId(),
      orderId: order.getId(),
      orderNumber: order.getOrderNumber(),
      status: savedPayment.getStatus(),
    };
  }
}
