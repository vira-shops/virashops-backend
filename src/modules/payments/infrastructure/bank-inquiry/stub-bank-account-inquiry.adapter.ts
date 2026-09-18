import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { EnvironmentVariables } from '../../../../config/env.validation';
import InvalidBankAccountFieldError from '../../domain/errors/invalid-bank-account-field.error';
import { isValidIranianNationalId } from '../../domain/services/iranian-national-id';
import { normalizePersianDigits } from '../../domain/services/persian-digits';
import type BankAccountInquiryPort from '../../domain/ports/bank-account-inquiry.port';
import type {
  BankAccountInquiryInput,
  BankAccountInquiryResult,
} from '../../domain/ports/bank-account-inquiry.port';

@Injectable()
export default class StubBankAccountInquiryAdapter implements BankAccountInquiryPort {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  inquire(input: BankAccountInquiryInput): Promise<BankAccountInquiryResult> {
    const nationalId = normalizePersianDigits(input.nationalId).replace(
      /\D/g,
      '',
    );
    const branchCode = normalizePersianDigits(input.branchCode).trim();

    if (!isValidIranianNationalId(nationalId)) {
      return Promise.reject(
        new InvalidBankAccountFieldError('National ID is invalid'),
      );
    }
    if (branchCode.length < 2) {
      return Promise.reject(
        new InvalidBankAccountFieldError('Branch code is required'),
      );
    }

    const forcedGrade = this.config.get('BANK_INQUIRY_STUB_GRADE', {
      infer: true,
    });
    const forcedCeiling = this.config.get('BANK_INQUIRY_STUB_CEILING', {
      infer: true,
    });
    if (forcedGrade && typeof forcedCeiling === 'number') {
      return Promise.resolve({
        creditGrade: forcedGrade.toUpperCase(),
        creditCeiling: forcedCeiling,
        providerRef: `stub-forced-${randomUUID()}`,
      });
    }

    const lastDigit = Number(nationalId[nationalId.length - 1]);
    let creditGrade: string;
    let creditCeiling: number;
    if (lastDigit <= 2) {
      creditGrade = 'A';
      creditCeiling = 250_000_000;
    } else if (lastDigit <= 5) {
      creditGrade = 'B';
      creditCeiling = 100_000_000;
    } else if (lastDigit <= 7) {
      creditGrade = 'C';
      creditCeiling = 50_000_000;
    } else {
      creditGrade = 'D';
      creditCeiling = 20_000_000;
    }

    return Promise.resolve({
      creditGrade,
      creditCeiling,
      providerRef: `stub-${nationalId.slice(-4)}-${randomUUID()}`,
    });
  }
}
