import ChequeSubmission from '../model/cheque-submission.model';
import ChequeVerificationStatus from '../model/enums/cheque-verification-status.enum';

export type ChequeReviewListItem = {
  submission: ChequeSubmission;
  paymentId: number;
  paymentAmount: number;
  paymentStatus: string;
  userId: number;
};

export default interface ChequeSubmissionRepositoryPort {
  findByPaymentId(paymentId: number): Promise<ChequeSubmission | null>;
  findById(id: number): Promise<ChequeSubmission | null>;
  listByStatus(
    status: ChequeVerificationStatus | null,
  ): Promise<ChequeReviewListItem[]>;
  save(submission: ChequeSubmission): Promise<ChequeSubmission>;
}
