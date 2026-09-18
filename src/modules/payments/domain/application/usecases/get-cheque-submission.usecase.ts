import { Inject, Injectable } from '@nestjs/common';
import InvalidChequeFieldError from '../../errors/invalid-cheque-field.error';
import PaymentNotFoundError from '../../errors/payment-not-found.error';
import PaymentMethodName from '../../model/enums/payment-method.enum';
import type ChequeSubmissionRepositoryPort from '../../ports/cheque-submission.repository.port';
import type PaymentRepositoryPort from '../../ports/payment.repository.port';
import {
  CHEQUE_SUBMISSION_REPOSITORY,
  PAYMENT_REPOSITORY,
} from '../../../shared/tokens/port.token';
import type { ChequeSubmissionView } from '../../view-models/cheque-submission.view';
import GetChequeSubmissionQuery from '../queries/get-cheque-submission.query';
import ChequeSubmissionPresenter from '../services/cheque-submission.presenter';

@Injectable()
export default class GetChequeSubmissionUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepositoryPort,
    @Inject(CHEQUE_SUBMISSION_REPOSITORY)
    private readonly submissions: ChequeSubmissionRepositoryPort,
    private readonly presenter: ChequeSubmissionPresenter,
  ) {}

  async execute(
    query: GetChequeSubmissionQuery,
  ): Promise<ChequeSubmissionView> {
    const payment = await this.payments.findByIdForUser(
      query.paymentId,
      query.userId,
    );
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    if (payment.getMethod() !== PaymentMethodName.CHEQUE) {
      throw new InvalidChequeFieldError('Payment is not a cheque payment');
    }

    const submission = await this.submissions.findByPaymentId(payment.getId());
    const order =
      payment.getOrderId() !== null
        ? {
            orderId: payment.getOrderId()!,
            orderNumber: '',
            status: payment.getStatus(),
          }
        : null;

    return this.presenter.present({
      paymentId: payment.getId(),
      payableAmount: payment.getAmount(),
      submission,
      order,
    });
  }
}
