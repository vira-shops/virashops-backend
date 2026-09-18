import { Inject, Injectable } from '@nestjs/common';
import type BankAccountValidationRepositoryPort from '../../ports/bank-account-validation.repository.port';
import type { BankAccountValidationView } from '../../view-models/bank-account-validation.view';
import { BANK_ACCOUNT_VALIDATION_REPOSITORY } from '../../../shared/tokens/port.token';
import GetLatestBankAccountValidationQuery from '../queries/get-latest-bank-account-validation.query';

@Injectable()
export default class GetLatestBankAccountValidationUseCase {
  constructor(
    @Inject(BANK_ACCOUNT_VALIDATION_REPOSITORY)
    private readonly validations: BankAccountValidationRepositoryPort,
  ) {}

  async execute(
    query: GetLatestBankAccountValidationQuery,
  ): Promise<BankAccountValidationView | null> {
    const latest = await this.validations.findLatestSucceededForUser(
      query.userId,
    );
    if (!latest) {
      return null;
    }
    return {
      id: latest.getId(),
      fullName: latest.getFullName(),
      accountNumber: latest.getAccountNumber(),
      nationalId: latest.getNationalId(),
      branchCode: latest.getBranchCode(),
      creditGrade: latest.getCreditGrade(),
      creditCeiling: latest.getCreditCeiling(),
      status: latest.getStatus(),
      expiresAt: latest.getExpiresAt()?.toISOString() ?? null,
      provider: latest.getProvider(),
    };
  }
}
