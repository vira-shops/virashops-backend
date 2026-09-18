import ChequeNotReviewableError from '../errors/cheque-not-reviewable.error';
import InvalidChequeFieldError from '../errors/invalid-cheque-field.error';
import ChequeSubmission from './cheque-submission.model';
import ChequeCadence from './enums/cheque-cadence.enum';
import ChequeRejectionReason from './enums/cheque-rejection-reason.enum';
import ChequeVerificationStatus from './enums/cheque-verification-status.enum';

describe('ChequeSubmission', () => {
  const base = {
    paymentId: 10,
    fullName: 'علی رضایی',
    accountNumber: '0123456789',
    nationalId: '0013542419',
    branchCode: '2574',
    photoKeys: ['uploads/cheque-1.jpg'],
    expectedPayableAmount: 5_000_000,
  };

  it('creates an awaiting-review submission', () => {
    const submission = ChequeSubmission.submit(base);
    expect(submission.getStatus()).toBe(
      ChequeVerificationStatus.AWAITING_REVIEW,
    );
    expect(submission.getNationalId()).toBe('0013542419');
    expect(submission.getPhotos()).toHaveLength(1);
  });

  it('rejects invalid national id', () => {
    expect(() =>
      ChequeSubmission.submit({ ...base, nationalId: '1234567890' }),
    ).toThrow(InvalidChequeFieldError);
  });

  it('requires at least one photo', () => {
    expect(() => ChequeSubmission.submit({ ...base, photoKeys: [] })).toThrow(
      InvalidChequeFieldError,
    );
  });

  it('validates plan total against payment amount', () => {
    expect(() =>
      ChequeSubmission.submit({
        ...base,
        photoKeys: ['uploads/a.jpg', 'uploads/b.jpg'],
        downPayment: 1_000_000,
        planItems: [
          { dueDate: '2099-01-01', amount: 2_000_000 },
          { dueDate: '2099-02-01', amount: 1_000_000 },
        ],
        expectedPayableAmount: 5_000_000,
      }),
    ).toThrow(InvalidChequeFieldError);
  });

  it('accepts a matching plan', () => {
    const submission = ChequeSubmission.submit({
      ...base,
      cadence: ChequeCadence.MONTHLY,
      photoKeys: ['uploads/a.jpg', 'uploads/b.jpg'],
      downPayment: 1_000_000,
      planItems: [
        { dueDate: '2099-01-01', amount: 2_000_000 },
        { dueDate: '2099-02-01', amount: 2_000_000 },
      ],
      expectedPayableAmount: 5_000_000,
    });
    expect(submission.getPlanItems()).toHaveLength(2);
    expect(submission.getDownPayment()).toBe(1_000_000);
  });

  it('rejects past due dates', () => {
    expect(() =>
      ChequeSubmission.submit({
        ...base,
        photoKeys: ['uploads/a.jpg'],
        planItems: [{ dueDate: '2000-01-01', amount: 5_000_000 }],
        expectedPayableAmount: 5_000_000,
      }),
    ).toThrow(InvalidChequeFieldError);
  });

  it('approves and rejects awaiting-review submissions', () => {
    const submission = ChequeSubmission.submit(base);
    submission.reject(
      99,
      [ChequeRejectionReason.IMAGE_QUALITY],
      'Blurry photo',
    );
    expect(submission.getStatus()).toBe(ChequeVerificationStatus.REJECTED);
    expect(submission.getRejectionReasons()).toEqual([
      ChequeRejectionReason.IMAGE_QUALITY,
    ]);
    expect(submission.getRejectionReason()).toBe('Blurry photo');

    submission.resubmit({
      fullName: base.fullName,
      accountNumber: base.accountNumber,
      nationalId: base.nationalId,
      branchCode: base.branchCode,
      photoKeys: base.photoKeys,
      expectedPayableAmount: base.expectedPayableAmount,
    });
    expect(submission.getStatus()).toBe(
      ChequeVerificationStatus.AWAITING_REVIEW,
    );

    submission.approve(7);
    expect(submission.getStatus()).toBe(ChequeVerificationStatus.APPROVED);
    expect(() =>
      submission.reject(7, [ChequeRejectionReason.SAYAD_MISMATCH]),
    ).toThrow(ChequeNotReviewableError);
  });
});
