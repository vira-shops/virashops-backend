import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../../../../config/env.validation';
import type {
  ChequeMailingInfo,
  ChequeSubmissionView,
} from '../../view-models/cheque-submission.view';
import { buildChequeSubmissionView } from '../../view-models/cheque-submission.view';
import ChequeSubmission from '../../model/cheque-submission.model';
import ChequeMediaPresenter from './cheque-media.presenter';

@Injectable()
export default class ChequeSubmissionPresenter {
  constructor(
    private readonly media: ChequeMediaPresenter,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  mailing(): ChequeMailingInfo {
    return {
      address: this.config.get('CHEQUE_MAILING_ADDRESS', { infer: true }),
      postalCode: this.config.get('CHEQUE_MAILING_POSTAL_CODE', {
        infer: true,
      }),
    };
  }

  async present(input: {
    paymentId: number;
    payableAmount: number;
    submission?: ChequeSubmission | null;
    order?: { orderId: number; orderNumber: string; status: string } | null;
  }): Promise<ChequeSubmissionView> {
    const photos = input.submission
      ? await this.media.photoUrls(input.submission)
      : [];
    return buildChequeSubmissionView({
      paymentId: input.paymentId,
      payableAmount: input.payableAmount,
      mailing: this.mailing(),
      submission: input.submission,
      photos,
      order: input.order ?? null,
    });
  }
}
