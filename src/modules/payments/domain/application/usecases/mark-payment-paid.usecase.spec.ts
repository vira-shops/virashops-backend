import PaymentNotPayableError from '../../errors/payment-not-payable.error';
import Payment from '../../model/payment.model';
import PaymentMethodName from '../../model/enums/payment-method.enum';
import PaymentStatus from '../../model/enums/payment-status.enum';
import MarkPaymentPaidCommand from '../commands/mark-payment-paid.command';
import MarkPaymentPaidUseCase from './mark-payment-paid.usecase';

describe('MarkPaymentPaidUseCase', () => {
  const payments = {
    findById: jest.fn(),
    findByIdForUser: jest.fn(),
    save: jest.fn((payment: Payment) => Promise.resolve(payment)),
  };
  const materializeOrder = {
    execute: jest.fn(),
  };
  const events = {
    emit: jest.fn(),
  };

  const useCase = new MarkPaymentPaidUseCase(
    payments,
    materializeOrder as never,
    events as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks buyer mark-paid for CHEQUE payments', async () => {
    payments.findByIdForUser.mockResolvedValue(
      Payment.restore({
        id: 1,
        userId: 2,
        checkoutSessionId: 3,
        orderId: null,
        method: PaymentMethodName.CHEQUE,
        amount: 1000,
        status: PaymentStatus.PENDING,
        providerRef: 'cheque-1',
        redirectUrl: null,
      }),
    );

    await expect(
      useCase.execute(new MarkPaymentPaidCommand(2, 1)),
    ).rejects.toBeInstanceOf(PaymentNotPayableError);
    expect(materializeOrder.execute).not.toHaveBeenCalled();
  });

  it('allows ONLINE mark-paid', async () => {
    const payment = Payment.restore({
      id: 1,
      userId: 2,
      checkoutSessionId: 3,
      orderId: null,
      method: PaymentMethodName.ONLINE,
      amount: 1000,
      status: PaymentStatus.PENDING,
      providerRef: 'online-1',
      redirectUrl: null,
    });
    payments.findByIdForUser.mockResolvedValue(payment);
    materializeOrder.execute.mockResolvedValue({
      getId: () => 55,
      getOrderNumber: () => 'ORD-55',
    });

    const result = await useCase.execute(new MarkPaymentPaidCommand(2, 1));
    expect(result.orderId).toBe(55);
    expect(result.status).toBe(PaymentStatus.PAID);
  });
});
