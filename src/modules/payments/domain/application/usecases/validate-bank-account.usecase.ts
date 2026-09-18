import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../../../../config/env.validation';
import BankAccountValidation from '../../model/bank-account-validation.model';
import type BankAccountInquiryPort from '../../ports/bank-account-inquiry.port';
import type BankAccountValidationRepositoryPort from '../../ports/bank-account-validation.repository.port';
import type { BankAccountValidationView } from '../../view-models/bank-account-validation.view';
import {
  BANK_ACCOUNT_INQUIRY,
  BANK_ACCOUNT_VALIDATION_REPOSITORY,
} from '../../../shared/tokens/port.token';
import ValidateBankAccountCommand from '../commands/validate-bank-account.command';

function toView(validation: BankAccountValidation): BankAccountValidationView {
  return {
    id: validation.getId(),
    fullName: validation.getFullName(),
    accountNumber: validation.getAccountNumber(),
    nationalId: validation.getNationalId(),
    branchCode: validation.getBranchCode(),
    creditGrade: validation.getCreditGrade(),
    creditCeiling: validation.getCreditCeiling(),
    status: validation.getStatus(),
    expiresAt: validation.getExpiresAt()?.toISOString() ?? null,
    provider: validation.getProvider(),
  };
}

@Injectable()
export default class ValidateBankAccountUseCase {
  constructor(
    @Inject(BANK_ACCOUNT_INQUIRY)
    private readonly inquiry: BankAccountInquiryPort,
    @Inject(BANK_ACCOUNT_VALIDATION_REPOSITORY)
    private readonly validations: BankAccountValidationRepositoryPort,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async execute(
    command: ValidateBankAccountCommand,
  ): Promise<BankAccountValidationView> {
    const result = await this.inquiry.inquire({
      fullName: command.fullName,
      accountNumber: command.accountNumber,
      nationalId: command.nationalId,
      branchCode: command.branchCode,
    });

    const ttlHours = this.config.get('BANK_VALIDATION_TTL_HOURS', {
      infer: true,
    });
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const validation = BankAccountValidation.createSucceeded({
      userId: command.userId,
      fullName: command.fullName,
      accountNumber: command.accountNumber,
      nationalId: command.nationalId,
      branchCode: command.branchCode,
      creditGrade: result.creditGrade,
      creditCeiling: result.creditCeiling,
      provider: 'STUB',
      providerRef: result.providerRef,
      expiresAt,
    });

    const saved = await this.validations.save(validation);
    return toView(saved);
  }
}
