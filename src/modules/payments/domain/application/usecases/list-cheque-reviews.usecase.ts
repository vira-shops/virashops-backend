import { Inject, Injectable } from '@nestjs/common';
import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import type ChequeSubmissionRepositoryPort from '../../ports/cheque-submission.repository.port';
import type PaymentRepositoryPort from '../../ports/payment.repository.port';
import {
  CHEQUE_SUBMISSION_REPOSITORY,
  PAYMENT_REPOSITORY,
} from '../../../shared/tokens/port.token';
import type { ChequeSubmissionView } from '../../view-models/cheque-submission.view';
import ListChequeReviewsQuery from '../queries/list-cheque-reviews.query';
import ChequeSubmissionPresenter from '../services/cheque-submission.presenter';

export type ChequeReviewListItemView = ChequeSubmissionView & {
  paymentAmount: number;
  paymentStatus: string;
  userId: number;
};

@Injectable()
export default class ListChequeReviewsUseCase {
  constructor(
    @Inject(CHEQUE_SUBMISSION_REPOSITORY)
    private readonly submissions: ChequeSubmissionRepositoryPort,
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepositoryPort,
    private readonly presenter: ChequeSubmissionPresenter,
  ) {}

  async execute(
    query: ListChequeReviewsQuery,
  ): Promise<ChequeReviewListItemView[]> {
    if (!query.actorRoles.includes(Role.ADMIN)) {
      throw new ForbiddenError();
    }

    const rows = await this.submissions.listByStatus(query.status);
    return Promise.all(
      rows.map(async (row) => {
        const payment = await this.payments.findById(row.paymentId);
        const view = await this.presenter.present({
          paymentId: row.paymentId,
          payableAmount: row.paymentAmount,
          submission: row.submission,
          order:
            payment?.getOrderId() != null
              ? {
                  orderId: payment.getOrderId()!,
                  orderNumber: '',
                  status: payment.getStatus(),
                }
              : null,
        });
        return {
          ...view,
          paymentAmount: row.paymentAmount,
          paymentStatus: row.paymentStatus,
          userId: row.userId,
        };
      }),
    );
  }
}
