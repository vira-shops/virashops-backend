import ChequeCadence from '../model/enums/cheque-cadence.enum';
import ChequeRejectionReason from '../model/enums/cheque-rejection-reason.enum';
import ChequeUiAction from '../model/enums/cheque-ui-action.enum';
import ChequeUiOutcome from '../model/enums/cheque-ui-outcome.enum';
import ChequeVerificationStatus from '../model/enums/cheque-verification-status.enum';
import type { ChequePlanItem } from '../model/cheque-submission.model';
import ChequeSubmission from '../model/cheque-submission.model';

export type ChequeMailingInfo = {
  address: string;
  postalCode: string;
};

export type ChequeWholesaleSummary = {
  payableAmount: number;
  downPayment: number;
  chequeTotal: number;
  /** Cash portion to pay online (مابه‌التفاوت / پیش‌پرداخت). */
  differenceAmount: number;
};

export type ChequeUiHints = {
  outcome: ChequeUiOutcome;
  nextActions: ChequeUiAction[];
};

export type ChequeSubmissionView = {
  paymentId: number;
  status: ChequeVerificationStatus;
  fullName: string | null;
  accountNumber: string | null;
  nationalId: string | null;
  branchCode: string | null;
  rejectionReason: string | null;
  rejectionReasons: ChequeRejectionReason[];
  reviewedAt: Date | null;
  cadence: ChequeCadence | null;
  downPayment: number | null;
  planItems: ChequePlanItem[];
  photos: Array<{ imageKey: string; url: string | null; sortOrder: number }>;
  mailing: ChequeMailingInfo | null;
  summary: ChequeWholesaleSummary | null;
  ui: ChequeUiHints;
  order: {
    orderId: number;
    orderNumber: string;
    status: string;
  } | null;
};

export type BuildChequeViewInput = {
  paymentId: number;
  payableAmount: number;
  mailing: ChequeMailingInfo;
  submission?: ChequeSubmission | null;
  photos?: Array<{ imageKey: string; url: string | null; sortOrder: number }>;
  order?: { orderId: number; orderNumber: string; status: string } | null;
};

export function buildChequeSubmissionView(
  input: BuildChequeViewInput,
): ChequeSubmissionView {
  const submission = input.submission ?? null;
  if (!submission) {
    return {
      paymentId: input.paymentId,
      status: ChequeVerificationStatus.AWAITING_DOCUMENTS,
      fullName: null,
      accountNumber: null,
      nationalId: null,
      branchCode: null,
      rejectionReason: null,
      rejectionReasons: [],
      reviewedAt: null,
      cadence: null,
      downPayment: null,
      planItems: [],
      photos: [],
      mailing: null,
      summary: {
        payableAmount: input.payableAmount,
        downPayment: 0,
        chequeTotal: 0,
        differenceAmount: input.payableAmount,
      },
      ui: {
        outcome: ChequeUiOutcome.AWAITING_DOCUMENTS,
        nextActions: [],
      },
      order: null,
    };
  }

  const status = submission.getStatus();
  const downPayment = submission.getDownPayment() ?? 0;
  const chequeTotal = submission.getChequeTotal();
  const differenceAmount = downPayment;

  let outcome: ChequeUiOutcome;
  let nextActions: ChequeUiAction[] = [];
  let mailing: ChequeMailingInfo | null = null;

  if (status === ChequeVerificationStatus.AWAITING_REVIEW) {
    outcome = ChequeUiOutcome.AWAITING_PHYSICAL;
    mailing = input.mailing;
    nextActions = [];
  } else if (status === ChequeVerificationStatus.REJECTED) {
    outcome = ChequeUiOutcome.REJECTED;
    nextActions = [
      ChequeUiAction.REUPLOAD,
      ChequeUiAction.CHANGE_PAYMENT_METHOD,
    ];
  } else if (status === ChequeVerificationStatus.APPROVED) {
    outcome = ChequeUiOutcome.APPROVED;
    nextActions = [
      ChequeUiAction.PAY_PREPAYMENT_ONLINE,
      ChequeUiAction.NEXT_INVOICE,
      ChequeUiAction.HOME,
    ];
  } else {
    outcome = ChequeUiOutcome.AWAITING_DOCUMENTS;
  }

  return {
    paymentId: submission.getPaymentId(),
    status,
    fullName: submission.getFullName(),
    accountNumber: submission.getAccountNumber(),
    nationalId: submission.getNationalId(),
    branchCode: submission.getBranchCode(),
    rejectionReason: submission.getRejectionReason(),
    rejectionReasons: submission.getRejectionReasons(),
    reviewedAt: submission.getReviewedAt(),
    cadence: submission.getCadence(),
    downPayment: submission.getDownPayment(),
    planItems: submission.getPlanItems(),
    photos: input.photos ?? [],
    mailing,
    summary: {
      payableAmount: input.payableAmount,
      downPayment,
      chequeTotal,
      differenceAmount,
    },
    ui: { outcome, nextActions },
    order: input.order ?? null,
  };
}

/** @deprecated use buildChequeSubmissionView */
export function awaitingDocumentsView(paymentId: number): ChequeSubmissionView {
  return buildChequeSubmissionView({
    paymentId,
    payableAmount: 0,
    mailing: { address: '', postalCode: '' },
  });
}

/** @deprecated use buildChequeSubmissionView */
export function toChequeSubmissionView(
  submission: ChequeSubmission,
  photos: Array<{ imageKey: string; url: string | null; sortOrder: number }>,
): ChequeSubmissionView {
  return buildChequeSubmissionView({
    paymentId: submission.getPaymentId(),
    payableAmount: 0,
    mailing: { address: '', postalCode: '' },
    submission,
    photos,
  });
}
