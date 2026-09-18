import ChequeNotReviewableError from '../errors/cheque-not-reviewable.error';
import InvalidChequeFieldError from '../errors/invalid-cheque-field.error';
import { isValidIranianNationalId } from '../services/iranian-national-id';
import ChequeCadence from './enums/cheque-cadence.enum';
import ChequeRejectionReason, {
  CHEQUE_REJECTION_REASON_VALUES,
} from './enums/cheque-rejection-reason.enum';
import ChequeVerificationStatus from './enums/cheque-verification-status.enum';

export type ChequePlanItem = {
  dueDate: string;
  amount: number;
};

export type ChequePhoto = {
  imageKey: string;
  sortOrder: number;
};

export type ChequeSubmissionProps = {
  id: number | null;
  paymentId: number;
  fullName: string;
  accountNumber: string;
  nationalId: string;
  branchCode: string;
  status: ChequeVerificationStatus;
  rejectionReason: string | null;
  rejectionReasons: ChequeRejectionReason[];
  reviewedByUserId: number | null;
  reviewedAt: Date | null;
  cadence: ChequeCadence | null;
  downPayment: number | null;
  planItems: ChequePlanItem[];
  photos: ChequePhoto[];
};

export type SubmitChequeInput = {
  paymentId: number;
  fullName: string;
  accountNumber: string;
  nationalId: string;
  branchCode: string;
  photoKeys: string[];
  cadence?: ChequeCadence | null;
  downPayment?: number | null;
  planItems?: ChequePlanItem[];
  expectedPayableAmount: number;
};

export default class ChequeSubmission {
  private constructor(private props: ChequeSubmissionProps) {}

  static submit(input: SubmitChequeInput): ChequeSubmission {
    const fields = ChequeSubmission.validatedFields(input);
    return new ChequeSubmission({
      id: null,
      paymentId: input.paymentId,
      ...fields,
      status: ChequeVerificationStatus.AWAITING_REVIEW,
      rejectionReason: null,
      rejectionReasons: [],
      reviewedByUserId: null,
      reviewedAt: null,
    });
  }

  static restore(props: ChequeSubmissionProps): ChequeSubmission {
    return new ChequeSubmission({
      ...props,
      rejectionReasons: props.rejectionReasons ?? [],
    });
  }

  resubmit(
    input: Omit<SubmitChequeInput, 'paymentId' | 'expectedPayableAmount'> & {
      expectedPayableAmount: number;
    },
  ): void {
    if (
      this.props.status !== ChequeVerificationStatus.REJECTED &&
      this.props.status !== ChequeVerificationStatus.AWAITING_REVIEW
    ) {
      throw new ChequeNotReviewableError(
        'Only rejected or awaiting-review submissions can be updated',
      );
    }
    const fields = ChequeSubmission.validatedFields({
      ...input,
      paymentId: this.props.paymentId,
    });
    Object.assign(this.props, fields, {
      status: ChequeVerificationStatus.AWAITING_REVIEW,
      rejectionReason: null,
      rejectionReasons: [],
      reviewedByUserId: null,
      reviewedAt: null,
    });
  }

  approve(adminUserId: number): void {
    if (this.props.status !== ChequeVerificationStatus.AWAITING_REVIEW) {
      throw new ChequeNotReviewableError();
    }
    this.props.status = ChequeVerificationStatus.APPROVED;
    this.props.reviewedByUserId = adminUserId;
    this.props.reviewedAt = new Date();
    this.props.rejectionReason = null;
    this.props.rejectionReasons = [];
  }

  reject(
    adminUserId: number,
    reasons: ChequeRejectionReason[],
    note?: string | null,
  ): void {
    if (this.props.status !== ChequeVerificationStatus.AWAITING_REVIEW) {
      throw new ChequeNotReviewableError();
    }
    const unique = [...new Set(reasons ?? [])];
    if (unique.length < 1) {
      throw new InvalidChequeFieldError(
        'At least one rejection reason is required',
      );
    }
    for (const reason of unique) {
      if (!CHEQUE_REJECTION_REASON_VALUES.includes(reason)) {
        throw new InvalidChequeFieldError(
          `Unknown rejection reason: ${reason}`,
        );
      }
    }
    const trimmed = note?.trim() || null;
    this.props.status = ChequeVerificationStatus.REJECTED;
    this.props.reviewedByUserId = adminUserId;
    this.props.reviewedAt = new Date();
    this.props.rejectionReasons = unique;
    this.props.rejectionReason = trimmed ?? unique.join(', ');
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Cheque submission has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getPaymentId(): number {
    return this.props.paymentId;
  }

  getStatus(): ChequeVerificationStatus {
    return this.props.status;
  }

  getFullName(): string {
    return this.props.fullName;
  }

  getAccountNumber(): string {
    return this.props.accountNumber;
  }

  getNationalId(): string {
    return this.props.nationalId;
  }

  getBranchCode(): string {
    return this.props.branchCode;
  }

  getRejectionReason(): string | null {
    return this.props.rejectionReason;
  }

  getRejectionReasons(): ChequeRejectionReason[] {
    return [...this.props.rejectionReasons];
  }

  getReviewedByUserId(): number | null {
    return this.props.reviewedByUserId;
  }

  getReviewedAt(): Date | null {
    return this.props.reviewedAt;
  }

  getCadence(): ChequeCadence | null {
    return this.props.cadence;
  }

  getDownPayment(): number | null {
    return this.props.downPayment;
  }

  getPlanItems(): ChequePlanItem[] {
    return this.props.planItems.map((item) => ({ ...item }));
  }

  getPhotos(): ChequePhoto[] {
    return this.props.photos.map((photo) => ({ ...photo }));
  }

  getChequeTotal(): number {
    return this.props.planItems.reduce((sum, item) => sum + item.amount, 0);
  }

  toSnapshot(): ChequeSubmissionProps {
    return {
      ...this.props,
      rejectionReasons: this.getRejectionReasons(),
      planItems: this.getPlanItems(),
      photos: this.getPhotos(),
    };
  }

  private static validatedFields(
    input: SubmitChequeInput,
  ): Pick<
    ChequeSubmissionProps,
    | 'fullName'
    | 'accountNumber'
    | 'nationalId'
    | 'branchCode'
    | 'cadence'
    | 'downPayment'
    | 'planItems'
    | 'photos'
  > {
    const fullName = input.fullName?.trim() ?? '';
    const accountNumber = input.accountNumber?.trim() ?? '';
    const nationalId = input.nationalId?.trim() ?? '';
    const branchCode = input.branchCode?.trim() ?? '';

    if (!fullName) {
      throw new InvalidChequeFieldError('Full name is required');
    }
    if (!accountNumber) {
      throw new InvalidChequeFieldError('Account number is required');
    }
    if (!isValidIranianNationalId(nationalId)) {
      throw new InvalidChequeFieldError('National ID is invalid');
    }
    if (!branchCode) {
      throw new InvalidChequeFieldError('Branch code is required');
    }

    const photoKeys = input.photoKeys ?? [];
    if (photoKeys.length < 1) {
      throw new InvalidChequeFieldError(
        'At least one cheque photo is required',
      );
    }

    const planItems = (input.planItems ?? []).map((item) => ({
      dueDate: item.dueDate?.trim() ?? '',
      amount: item.amount,
    }));

    if (planItems.length > 0) {
      if (photoKeys.length !== planItems.length) {
        throw new InvalidChequeFieldError(
          'Photo count must match the number of plan cheques',
        );
      }
      const today = startOfUtcDay(new Date());
      for (const item of planItems) {
        if (!item.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)) {
          throw new InvalidChequeFieldError(
            'Cheque due dates must be ISO dates (YYYY-MM-DD)',
          );
        }
        if (!Number.isInteger(item.amount) || item.amount <= 0) {
          throw new InvalidChequeFieldError(
            'Cheque amounts must be positive integers',
          );
        }
        const due = parseIsoDate(item.dueDate);
        if (due < today) {
          throw new InvalidChequeFieldError(
            'Cheque due dates cannot be in the past',
          );
        }
      }

      const downPayment = input.downPayment ?? 0;
      if (!Number.isInteger(downPayment) || downPayment < 0) {
        throw new InvalidChequeFieldError(
          'Down payment must be a non-negative integer',
        );
      }
      const planTotal =
        planItems.reduce((sum, item) => sum + item.amount, 0) + downPayment;
      if (planTotal !== input.expectedPayableAmount) {
        throw new InvalidChequeFieldError(
          'Cheque plan total plus down payment must equal the payment amount',
        );
      }
    } else if (
      input.downPayment !== undefined &&
      input.downPayment !== null &&
      (!Number.isInteger(input.downPayment) || input.downPayment < 0)
    ) {
      throw new InvalidChequeFieldError(
        'Down payment must be a non-negative integer',
      );
    }

    return {
      fullName,
      accountNumber,
      nationalId: nationalId.replace(/\D/g, ''),
      branchCode,
      cadence: input.cadence ?? null,
      downPayment:
        input.downPayment === undefined || input.downPayment === null
          ? null
          : input.downPayment,
      planItems,
      photos: photoKeys.map((imageKey, index) => ({
        imageKey,
        sortOrder: index,
      })),
    };
  }
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
