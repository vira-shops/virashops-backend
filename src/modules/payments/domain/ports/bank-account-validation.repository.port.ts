import BankAccountValidation from '../model/bank-account-validation.model';

export default interface BankAccountValidationRepositoryPort {
  save(validation: BankAccountValidation): Promise<BankAccountValidation>;
  findLatestSucceededForUser(
    userId: number,
    now?: Date,
  ): Promise<BankAccountValidation | null>;
  findById(id: number): Promise<BankAccountValidation | null>;
}
