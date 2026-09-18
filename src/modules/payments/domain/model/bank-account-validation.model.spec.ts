import InvalidBankAccountFieldError from '../errors/invalid-bank-account-field.error';
import BankAccountValidation from './bank-account-validation.model';

describe('BankAccountValidation', () => {
  const base = {
    userId: 1,
    fullName: 'علی رضایی',
    accountNumber: '۰۱۲۳۴۵۶۷۸۹',
    nationalId: '۰۰۱۳۵۴۲۴۱۹',
    branchCode: '۲۵۷۴',
    creditGrade: 'A',
    creditCeiling: 250_000_000,
    provider: 'STUB',
    providerRef: 'stub-1',
    expiresAt: new Date(Date.now() + 60_000),
  };

  it('normalizes Persian digits on create', () => {
    const validation = BankAccountValidation.createSucceeded(base);
    expect(validation.getNationalId()).toBe('0013542419');
    expect(validation.getAccountNumber()).toBe('0123456789');
    expect(validation.getBranchCode()).toBe('2574');
  });

  it('rejects invalid national id', () => {
    expect(() =>
      BankAccountValidation.createSucceeded({
        ...base,
        nationalId: '0013542418',
      }),
    ).toThrow(InvalidBankAccountFieldError);
  });

  it('coversAmount requires fresh ceiling', () => {
    const validation = BankAccountValidation.createSucceeded(base);
    expect(validation.coversAmount(10_000_000)).toBe(true);
    expect(validation.coversAmount(300_000_000)).toBe(false);
  });
});
