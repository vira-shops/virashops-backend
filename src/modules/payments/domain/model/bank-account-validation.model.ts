import InvalidBankAccountFieldError from '../errors/invalid-bank-account-field.error';
import { isValidIranianNationalId } from '../services/iranian-national-id';
import { normalizePersianDigits } from '../services/persian-digits';
import BankAccountValidationStatus from './enums/bank-account-validation-status.enum';

export type BankAccountValidationProps = {
  id: number | null;
  userId: number;
  fullName: string;
  accountNumber: string;
  nationalId: string;
  branchCode: string;
  creditGrade: string | null;
  creditCeiling: number | null;
  provider: string;
  providerRef: string | null;
  status: BankAccountValidationStatus;
  expiresAt: Date | null;
};

export default class BankAccountValidation {
  private constructor(private props: BankAccountValidationProps) {}

  static createSucceeded(input: {
    userId: number;
    fullName: string;
    accountNumber: string;
    nationalId: string;
    branchCode: string;
    creditGrade: string;
    creditCeiling: number;
    provider: string;
    providerRef: string;
    expiresAt: Date;
  }): BankAccountValidation {
    const fields = BankAccountValidation.validatedIdentity(input);
    if (!input.creditGrade?.trim()) {
      throw new InvalidBankAccountFieldError('Credit grade is required');
    }
    if (!Number.isInteger(input.creditCeiling) || input.creditCeiling < 0) {
      throw new InvalidBankAccountFieldError(
        'Credit ceiling must be a non-negative integer',
      );
    }
    return new BankAccountValidation({
      id: null,
      userId: input.userId,
      ...fields,
      creditGrade: input.creditGrade.trim().toUpperCase(),
      creditCeiling: input.creditCeiling,
      provider: input.provider,
      providerRef: input.providerRef,
      status: BankAccountValidationStatus.SUCCEEDED,
      expiresAt: input.expiresAt,
    });
  }

  static restore(props: BankAccountValidationProps): BankAccountValidation {
    return new BankAccountValidation(props);
  }

  isFresh(now = new Date()): boolean {
    return (
      this.props.status === BankAccountValidationStatus.SUCCEEDED &&
      this.props.expiresAt !== null &&
      this.props.expiresAt.getTime() > now.getTime() &&
      typeof this.props.creditCeiling === 'number'
    );
  }

  coversAmount(amount: number): boolean {
    return (
      this.isFresh() &&
      this.props.creditCeiling !== null &&
      this.props.creditCeiling >= amount
    );
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Bank account validation has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getUserId(): number {
    return this.props.userId;
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

  getCreditGrade(): string | null {
    return this.props.creditGrade;
  }

  getCreditCeiling(): number | null {
    return this.props.creditCeiling;
  }

  getProvider(): string {
    return this.props.provider;
  }

  getProviderRef(): string | null {
    return this.props.providerRef;
  }

  getStatus(): BankAccountValidationStatus {
    return this.props.status;
  }

  getExpiresAt(): Date | null {
    return this.props.expiresAt;
  }

  toSnapshot(): BankAccountValidationProps {
    return { ...this.props };
  }

  private static validatedIdentity(input: {
    fullName: string;
    accountNumber: string;
    nationalId: string;
    branchCode: string;
  }) {
    const fullName = input.fullName?.trim() ?? '';
    const accountNumber = normalizePersianDigits(
      input.accountNumber?.trim() ?? '',
    ).replace(/\s+/g, '');
    const nationalId = normalizePersianDigits(
      input.nationalId?.trim() ?? '',
    ).replace(/\D/g, '');
    const branchCode = normalizePersianDigits(
      input.branchCode?.trim() ?? '',
    ).replace(/\s+/g, '');

    if (!fullName) {
      throw new InvalidBankAccountFieldError('Full name is required');
    }
    if (!accountNumber || accountNumber.length < 4) {
      throw new InvalidBankAccountFieldError('Account number is required');
    }
    if (!isValidIranianNationalId(nationalId)) {
      throw new InvalidBankAccountFieldError('National ID is invalid');
    }
    if (branchCode.length < 2) {
      throw new InvalidBankAccountFieldError('Branch code is required');
    }

    return { fullName, accountNumber, nationalId, branchCode };
  }
}
