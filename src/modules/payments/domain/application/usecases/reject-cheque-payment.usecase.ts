import { Inject, Injectable } from '@nestjs/common';
import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import ChequeSubmissionNotFoundError from '../../errors/cheque-submission-not-found.error';
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
import RejectChequePaymentCommand from '../commands/reject-cheque-payment.command';
import ChequeSubmissionPresenter from '../services/cheque-submission.presenter';

@Injectable()
export default class RejectChequePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepositoryPort,
    @Inject(CHEQUE_SUBMISSION_REPOSITORY)
    private readonly submissions: ChequeSubmissionRepositoryPort,
    private readonly presenter: ChequeSubmissionPresenter,
  ) {}

  async execute(
    command: RejectChequePaymentCommand,
  ): Promise<ChequeSubmissionView> {
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

    submission.reject(command.adminUserId, command.reasons, command.note);
    const saved = await this.submissions.save(submission);
    return this.presenter.present({
      paymentId: payment.getId(),
      payableAmount: payment.getAmount(),
      submission: saved,
    });
  }
}
