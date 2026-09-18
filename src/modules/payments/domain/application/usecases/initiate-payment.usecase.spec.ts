import BankAccountValidation from '../../model/bank-account-validation.model';
import BankAccountValidationStatus from '../../model/enums/bank-account-validation-status.enum';
import BankCreditInsufficientError from '../../errors/bank-credit-insufficient.error';
import BankValidationRequiredError from '../../errors/bank-validation-required.error';
import PaymentMethodName from '../../model/enums/payment-method.enum';
import PaymentStatus from '../../model/enums/payment-status.enum';
import Payment from '../../model/payment.model';
import InitiatePaymentCommand from '../commands/initiate-payment.command';
import InitiatePaymentUseCase from './initiate-payment.usecase';

describe('InitiatePaymentUseCase CHEQUE bank gate', () => {
  const session = {
    getId: () => 10,
    getSellerId: () => 1,
    getPayableAmount: () => 5_000_000,
  };
  const getPayableCheckout = { execute: jest.fn() };
  const chequeMethod = {
    name: PaymentMethodName.CHEQUE,
    supports: () => true,
    initiate: jest.fn(() =>
      Promise.resolve({
        kind: 'manual' as const,
        providerRef: 'cheque-ref',
      }),
    ),
  };
  const methods = {
    get: jest.fn(() => chequeMethod),
  };
  const payments = {
    findById: jest.fn(),
    findByIdForUser: jest.fn(),
    save: jest.fn((payment: Payment) => {
      if (!payment.hasId()) {
        return Promise.resolve(
          Payment.restore({
            ...payment.toSnapshot(),
            id: 99,
          }),
        );
      }
      return Promise.resolve(payment);
    }),
  };
  const bankValidations = {
    save: jest.fn(),
    findLatestSucceededForUser: jest.fn(),
    findById: jest.fn(),
  };

  const useCase = new InitiatePaymentUseCase(
    getPayableCheckout as never,
    methods as never,
    payments,
    bankValidations,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    getPayableCheckout.execute.mockResolvedValue(session);
  });

  it('rejects CHEQUE without fresh validation', async () => {
    bankValidations.findLatestSucceededForUser.mockResolvedValue(null);

    await expect(
      useCase.execute(
        new InitiatePaymentCommand(
          2,
          10,
          PaymentMethodName.CHEQUE,
          'https://cb',
        ),
      ),
    ).rejects.toBeInstanceOf(BankValidationRequiredError);
    expect(payments.save).not.toHaveBeenCalled();
  });

  it('rejects CHEQUE when credit ceiling is too low', async () => {
    bankValidations.findLatestSucceededForUser.mockResolvedValue(
      BankAccountValidation.restore({
        id: 7,
        userId: 2,
        fullName: 'علی',
        accountNumber: '12345678',
        nationalId: '0013542419',
        branchCode: '2574',
        creditGrade: 'D',
        creditCeiling: 1_000_000,
        provider: 'STUB',
        providerRef: 'stub-1',
        status: BankAccountValidationStatus.SUCCEEDED,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    );

    await expect(
      useCase.execute(
        new InitiatePaymentCommand(
          2,
          10,
          PaymentMethodName.CHEQUE,
          'https://cb',
        ),
      ),
    ).rejects.toBeInstanceOf(BankCreditInsufficientError);
    expect(payments.save).not.toHaveBeenCalled();
  });

  it('initiates CHEQUE when validation covers payable amount', async () => {
    bankValidations.findLatestSucceededForUser.mockResolvedValue(
      BankAccountValidation.restore({
        id: 7,
        userId: 2,
        fullName: 'علی',
        accountNumber: '12345678',
        nationalId: '0013542419',
        branchCode: '2574',
        creditGrade: 'A',
        creditCeiling: 250_000_000,
        provider: 'STUB',
        providerRef: 'stub-1',
        status: BankAccountValidationStatus.SUCCEEDED,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    );

    const result = await useCase.execute(
      new InitiatePaymentCommand(2, 10, PaymentMethodName.CHEQUE, 'https://cb'),
    );

    expect(result.paymentId).toBe(99);
    expect(result.kind).toBe('manual');
    expect(result.status).toBe(PaymentStatus.PENDING);
    expect(payments.save).toHaveBeenCalled();
    const firstSave = payments.save.mock.calls[0][0];
    expect(firstSave.getBankAccountValidationId()).toBe(7);
  });
});
