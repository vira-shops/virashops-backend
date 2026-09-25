import InvalidFileError from '../../../../files/domain/errors/invalid-file.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import ChequeSubmission from '../../model/cheque-submission.model';
import Payment from '../../model/payment.model';
import ChequeRejectionReason from '../../model/enums/cheque-rejection-reason.enum';
import ChequeUiAction from '../../model/enums/cheque-ui-action.enum';
import ChequeUiOutcome from '../../model/enums/cheque-ui-outcome.enum';
import ChequeVerificationStatus from '../../model/enums/cheque-verification-status.enum';
import PaymentMethodName from '../../model/enums/payment-method.enum';
import PaymentStatus from '../../model/enums/payment-status.enum';
import { buildChequeSubmissionView } from '../../view-models/cheque-submission.view';
import ApproveChequePaymentCommand from '../commands/approve-cheque-payment.command';
import RejectChequePaymentCommand from '../commands/reject-cheque-payment.command';
import SubmitChequeVerificationCommand from '../commands/submit-cheque-verification.command';
import ApproveChequePaymentUseCase from './approve-cheque-payment.usecase';
import RejectChequePaymentUseCase from './reject-cheque-payment.usecase';
import SubmitChequeVerificationUseCase from './submit-cheque-verification.usecase';

function chequePayment() {
  return Payment.restore({
    id: 11,
    userId: 22,
    checkoutSessionId: 33,
    orderId: null,
    method: PaymentMethodName.CHEQUE,
    amount: 5_000_000,
    status: PaymentStatus.PENDING,
    providerRef: 'cheque-ref',
    redirectUrl: null,
  });
}

const mailing = {
  address: 'استان یزد، شهر اردکان',
  postalCode: '1234567891',
};

function mockPresenter() {
  return {
    mailing: jest.fn(() => mailing),
    present: jest.fn(
      (input: {
        paymentId: number;
        payableAmount: number;
        submission?: ChequeSubmission | null;
        order?: {
          orderId: number;
          orderNumber: string;
          status: string;
        } | null;
      }) =>
        Promise.resolve(
          buildChequeSubmissionView({
            paymentId: input.paymentId,
            payableAmount: input.payableAmount,
            mailing,
            submission: input.submission,
            photos: (input.submission?.getPhotos() ?? []).map((p) => ({
              ...p,
              url: `https://cdn/${p.imageKey}`,
            })),
            order: input.order ?? null,
          }),
        ),
    ),
  };
}

describe('SubmitChequeVerificationUseCase', () => {
  const payments = {
    findById: jest.fn(),
    findByIdForUser: jest.fn(),
    save: jest.fn(),
  };
  const submissions = {
    findByPaymentId: jest.fn(),
    findById: jest.fn(),
    listByStatus: jest.fn(),
    save: jest.fn((s: ChequeSubmission) => {
      if (!s.hasId()) {
        return Promise.resolve(
          ChequeSubmission.restore({ ...s.toSnapshot(), id: 100 }),
        );
      }
      return Promise.resolve(s);
    }),
  };
  const presenter = mockPresenter();

  const useCase = new SubmitChequeVerificationUseCase(
    payments,
    submissions,
    presenter as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    payments.findByIdForUser.mockResolvedValue(chequePayment());
    submissions.findByPaymentId.mockResolvedValue(null);
  });

  it('submits cheque documents and returns physical-mailing UI outcome', async () => {
    const view = await useCase.execute(
      new SubmitChequeVerificationCommand(
        22,
        11,
        'علی رضایی',
        '0123456789',
        '0013542419',
        '2574',
        ['uploads/cheque-1.jpg'],
      ),
    );
    expect(view.status).toBe(ChequeVerificationStatus.AWAITING_REVIEW);
    expect(view.ui.outcome).toBe(ChequeUiOutcome.AWAITING_PHYSICAL);
    expect(view.mailing?.postalCode).toBe('1234567891');
    expect(view.photos[0]?.imageKey).toBe('uploads/cheque-1.jpg');
  });

  it('rejects non-upload photo keys', async () => {
    await expect(
      useCase.execute(
        new SubmitChequeVerificationCommand(
          22,
          11,
          'علی رضایی',
          '0123456789',
          '0013542419',
          '2574',
          ['https://evil.example/photo.jpg'],
        ),
      ),
    ).rejects.toBeInstanceOf(InvalidFileError);
  });
});

describe('ApproveChequePaymentUseCase', () => {
  const payments = {
    findById: jest.fn(),
    findByIdForUser: jest.fn(),
    save: jest.fn((p: Payment) => Promise.resolve(p)),
  };
  const submissions = {
    findByPaymentId: jest.fn(),
    findById: jest.fn(),
    listByStatus: jest.fn(),
    save: jest.fn((s: ChequeSubmission) => Promise.resolve(s)),
  };
  const materializeOrder = {
    execute: jest.fn(),
  };
  const presenter = mockPresenter();
  const events = { emit: jest.fn() };

  const useCase = new ApproveChequePaymentUseCase(
    payments,
    submissions,
    materializeOrder as never,
    presenter as never,
    events as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects non-admin', async () => {
    await expect(
      useCase.execute(
        new ApproveChequePaymentCommand(11, 1, [Role.WHOLESALE_BUYER]),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('approves and returns success UI next actions', async () => {
    const payment = chequePayment();
    const submission = ChequeSubmission.restore({
      ...ChequeSubmission.submit({
        paymentId: 11,
        fullName: 'علی رضایی',
        accountNumber: '0123456789',
        nationalId: '0013542419',
        branchCode: '2574',
        photoKeys: ['uploads/c.jpg'],
        expectedPayableAmount: 5_000_000,
      }).toSnapshot(),
      id: 50,
    });
    payments.findById.mockResolvedValue(payment);
    submissions.findByPaymentId.mockResolvedValue(submission);
    materializeOrder.execute.mockResolvedValue({
      getId: () => 77,
      getOrderNumber: () => 'ORD-77',
    });

    const result = await useCase.execute(
      new ApproveChequePaymentCommand(11, 9, [Role.ADMIN]),
    );
    expect(result.orderId).toBe(77);
    expect(result.status).toBe(PaymentStatus.PAID);
    expect(result.submission.ui.outcome).toBe(ChequeUiOutcome.APPROVED);
    expect(result.submission.ui.nextActions).toEqual([
      ChequeUiAction.PAY_PREPAYMENT_ONLINE,
      ChequeUiAction.NEXT_INVOICE,
      ChequeUiAction.HOME,
    ]);
    expect(result.submission.order?.orderId).toBe(77);
  });
});

describe('RejectChequePaymentUseCase', () => {
  const payments = {
    findById: jest.fn(),
    findByIdForUser: jest.fn(),
    save: jest.fn(),
  };
  const submissions = {
    findByPaymentId: jest.fn(),
    findById: jest.fn(),
    listByStatus: jest.fn(),
    save: jest.fn((s: ChequeSubmission) => Promise.resolve(s)),
  };
  const presenter = mockPresenter();
  const useCase = new RejectChequePaymentUseCase(
    payments,
    submissions,
    presenter as never,
  );

  it('rejects with structured reasons for fail modal', async () => {
    const submission = ChequeSubmission.restore({
      ...ChequeSubmission.submit({
        paymentId: 11,
        fullName: 'علی رضایی',
        accountNumber: '0123456789',
        nationalId: '0013542419',
        branchCode: '2574',
        photoKeys: ['uploads/c.jpg'],
        expectedPayableAmount: 5_000_000,
      }).toSnapshot(),
      id: 50,
    });
    payments.findById.mockResolvedValue(chequePayment());
    submissions.findByPaymentId.mockResolvedValue(submission);

    const view = await useCase.execute(
      new RejectChequePaymentCommand(
        11,
        9,
        [Role.ADMIN],
        [
          ChequeRejectionReason.IMAGE_QUALITY,
          ChequeRejectionReason.SAYAD_MISMATCH,
        ],
        'Unreadable',
      ),
    );
    expect(view.status).toBe(ChequeVerificationStatus.REJECTED);
    expect(view.rejectionReasons).toEqual([
      ChequeRejectionReason.IMAGE_QUALITY,
      ChequeRejectionReason.SAYAD_MISMATCH,
    ]);
    expect(view.ui.outcome).toBe(ChequeUiOutcome.REJECTED);
    expect(view.ui.nextActions).toEqual([
      ChequeUiAction.REUPLOAD,
      ChequeUiAction.CHANGE_PAYMENT_METHOD,
    ]);
  });
});
