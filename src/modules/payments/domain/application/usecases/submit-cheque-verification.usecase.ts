import { Inject, Injectable } from '@nestjs/common';
import InvalidFileError from '../../../../files/domain/errors/invalid-file.error';
import {
  isStoredFileKey,
  resolveStoredFileKey,
} from '../../../../shared/utils/stored-file-url.util';
import InvalidChequeFieldError from '../../errors/invalid-cheque-field.error';
import PaymentNotFoundError from '../../errors/payment-not-found.error';
import PaymentNotPayableError from '../../errors/payment-not-payable.error';
import ChequeSubmission from '../../model/cheque-submission.model';
import PaymentMethodName from '../../model/enums/payment-method.enum';
import PaymentStatus from '../../model/enums/payment-status.enum';
import type ChequeSubmissionRepositoryPort from '../../ports/cheque-submission.repository.port';
import type PaymentRepositoryPort from '../../ports/payment.repository.port';
import {
  CHEQUE_SUBMISSION_REPOSITORY,
  PAYMENT_REPOSITORY,
} from '../../../shared/tokens/port.token';
import type { ChequeSubmissionView } from '../../view-models/cheque-submission.view';
import SubmitChequeVerificationCommand from '../commands/submit-cheque-verification.command';
import ChequeSubmissionPresenter from '../services/cheque-submission.presenter';

@Injectable()
export default class SubmitChequeVerificationUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepositoryPort,
    @Inject(CHEQUE_SUBMISSION_REPOSITORY)
    private readonly submissions: ChequeSubmissionRepositoryPort,
    private readonly presenter: ChequeSubmissionPresenter,
  ) {}

  async execute(
    command: SubmitChequeVerificationCommand,
  ): Promise<ChequeSubmissionView> {
    const payment = await this.payments.findByIdForUser(
      command.paymentId,
      command.userId,
    );
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    if (payment.getMethod() !== PaymentMethodName.CHEQUE) {
      throw new InvalidChequeFieldError('Payment is not a cheque payment');
    }
    if (
      payment.getStatus() !== PaymentStatus.PENDING &&
      payment.getStatus() !== PaymentStatus.CREATED
    ) {
      throw new PaymentNotPayableError(
        'Cheque payment is not awaiting documents',
      );
    }

    const photoKeys = command.photoKeysOrUrls.map((value) => {
      const key = resolveStoredFileKey(value);
      if (!key || !isStoredFileKey(key)) {
        throw new InvalidFileError(
          'Cheque photos must be uploaded via /files/upload (key under uploads/)',
        );
      }
      return key.startsWith('uploads/')
        ? key
        : key.slice(key.indexOf('uploads/'));
    });

    const existing = await this.submissions.findByPaymentId(payment.getId());
    let saved: ChequeSubmission;
    if (existing) {
      existing.resubmit({
        fullName: command.fullName,
        accountNumber: command.accountNumber,
        nationalId: command.nationalId,
        branchCode: command.branchCode,
        photoKeys,
        cadence: command.cadence,
        downPayment: command.downPayment,
        planItems: command.planItems,
        expectedPayableAmount: payment.getAmount(),
      });
      saved = await this.submissions.save(existing);
    } else {
      const created = ChequeSubmission.submit({
        paymentId: payment.getId(),
        fullName: command.fullName,
        accountNumber: command.accountNumber,
        nationalId: command.nationalId,
        branchCode: command.branchCode,
        photoKeys,
        cadence: command.cadence,
        downPayment: command.downPayment,
        planItems: command.planItems,
        expectedPayableAmount: payment.getAmount(),
      });
      saved = await this.submissions.save(created);
    }

    return this.presenter.present({
      paymentId: payment.getId(),
      payableAmount: payment.getAmount(),
      submission: saved,
    });
  }
}
