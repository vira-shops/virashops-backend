import { ConfigService } from '@nestjs/config';
import InvalidBankAccountFieldError from '../../domain/errors/invalid-bank-account-field.error';
import StubBankAccountInquiryAdapter from './stub-bank-account-inquiry.adapter';

describe('StubBankAccountInquiryAdapter', () => {
  function adapter(env: Record<string, unknown> = {}) {
    const config = {
      get: (key: string) => env[key],
    } as ConfigService;
    return new StubBankAccountInquiryAdapter(config as never);
  }

  const base = {
    fullName: 'علی رضایی',
    accountNumber: '0123456789',
    branchCode: '2574',
  };

  it('fails on invalid national id', async () => {
    await expect(
      adapter().inquire({ ...base, nationalId: '0013542418' }),
    ).rejects.toBeInstanceOf(InvalidBankAccountFieldError);
  });

  it('fails on short branch code', async () => {
    await expect(
      adapter().inquire({ ...base, nationalId: '0013542419', branchCode: '1' }),
    ).rejects.toBeInstanceOf(InvalidBankAccountFieldError);
  });

  it('maps last digit 0–2 to grade A', async () => {
    const result = await adapter().inquire({
      ...base,
      nationalId: '0000000140',
    });
    expect(result.creditGrade).toBe('A');
    expect(result.creditCeiling).toBe(250_000_000);
  });

  it('maps last digit 3–5 to grade B', async () => {
    const result = await adapter().inquire({
      ...base,
      nationalId: '0000000043',
    });
    expect(result.creditGrade).toBe('B');
    expect(result.creditCeiling).toBe(100_000_000);
  });

  it('maps last digit 6–7 to grade C', async () => {
    const result = await adapter().inquire({
      ...base,
      nationalId: '0000000086',
    });
    expect(result.creditGrade).toBe('C');
    expect(result.creditCeiling).toBe(50_000_000);
  });

  it('maps last digit 8–9 to grade D', async () => {
    const result = await adapter().inquire({
      ...base,
      nationalId: '0013542419',
    });
    expect(result.creditGrade).toBe('D');
    expect(result.creditCeiling).toBe(20_000_000);
  });

  it('honors stub env overrides', async () => {
    const result = await adapter({
      BANK_INQUIRY_STUB_GRADE: 'a',
      BANK_INQUIRY_STUB_CEILING: 1_000,
    }).inquire({ ...base, nationalId: '0013542419' });
    expect(result.creditGrade).toBe('A');
    expect(result.creditCeiling).toBe(1_000);
  });
});
