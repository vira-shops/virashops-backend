import { Module } from '@nestjs/common';
import {
  BANK_ACCOUNT_INQUIRY,
  BANK_ACCOUNT_VALIDATION_REPOSITORY,
  CHEQUE_SUBMISSION_REPOSITORY,
  PAYMENT_METHODS,
  PAYMENT_REPOSITORY,
} from '../shared/tokens/port.token';
import StubBankAccountInquiryAdapter from './bank-inquiry/stub-bank-account-inquiry.adapter';
import ChequePaymentAdapter from './cheque/cheque.payment.adapter';
import CreditLcPaymentAdapter from './credit-lc/credit-lc.payment.adapter';
import DrizzleBankAccountValidationRepositoryAdapter from './drizzle/repositories/bank-account-validation.repository.adapter';
import DrizzleChequeSubmissionRepositoryAdapter from './drizzle/repositories/cheque-submission.repository.adapter';
import DrizzlePaymentRepositoryAdapter from './drizzle/repositories/payment.repository.adapter';
import OnlineStubPaymentAdapter from './online/online-stub.payment.adapter';
import PayrollPaymentAdapter from './payroll/payroll.payment.adapter';

@Module({
  providers: [
    {
      provide: PAYMENT_REPOSITORY,
      useClass: DrizzlePaymentRepositoryAdapter,
    },
    {
      provide: CHEQUE_SUBMISSION_REPOSITORY,
      useClass: DrizzleChequeSubmissionRepositoryAdapter,
    },
    {
      provide: BANK_ACCOUNT_VALIDATION_REPOSITORY,
      useClass: DrizzleBankAccountValidationRepositoryAdapter,
    },
    {
      provide: BANK_ACCOUNT_INQUIRY,
      useClass: StubBankAccountInquiryAdapter,
    },
    OnlineStubPaymentAdapter,
    ChequePaymentAdapter,
    PayrollPaymentAdapter,
    CreditLcPaymentAdapter,
    {
      provide: PAYMENT_METHODS,
      inject: [
        OnlineStubPaymentAdapter,
        ChequePaymentAdapter,
        PayrollPaymentAdapter,
        CreditLcPaymentAdapter,
      ],
      useFactory: (
        online: OnlineStubPaymentAdapter,
        cheque: ChequePaymentAdapter,
        payroll: PayrollPaymentAdapter,
        lc: CreditLcPaymentAdapter,
      ) => [online, cheque, payroll, lc],
    },
  ],
  exports: [
    PAYMENT_REPOSITORY,
    CHEQUE_SUBMISSION_REPOSITORY,
    BANK_ACCOUNT_VALIDATION_REPOSITORY,
    BANK_ACCOUNT_INQUIRY,
    PAYMENT_METHODS,
  ],
})
export default class PaymentsInfrastructureModule {}
