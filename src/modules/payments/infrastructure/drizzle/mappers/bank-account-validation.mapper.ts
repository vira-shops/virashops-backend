import BankAccountValidation from '../../../domain/model/bank-account-validation.model';
import BankAccountValidationStatus from '../../../domain/model/enums/bank-account-validation-status.enum';
import type { BankAccountValidationRow } from '../schema/bank-account-validations';

export default class BankAccountValidationMapper {
  static toDomain(row: BankAccountValidationRow): BankAccountValidation {
    return BankAccountValidation.restore({
      id: row.id,
      userId: row.userId,
      fullName: row.fullName,
      accountNumber: row.accountNumber,
      nationalId: row.nationalId,
      branchCode: row.branchCode,
      creditGrade: row.creditGrade,
      creditCeiling: row.creditCeiling,
      provider: row.provider,
      providerRef: row.providerRef,
      status: row.status as BankAccountValidationStatus,
      expiresAt: row.expiresAt,
    });
  }
}
