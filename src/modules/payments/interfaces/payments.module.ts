import { Module } from '@nestjs/common';
import OrdersModule from '../../orders/interfaces/orders.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import PaymentMethodRegistry from '../domain/application/services/payment-method.registry';
import ChequeMediaPresenter from '../domain/application/services/cheque-media.presenter';
import ChequeSubmissionPresenter from '../domain/application/services/cheque-submission.presenter';
import ApproveChequePaymentUseCase from '../domain/application/usecases/approve-cheque-payment.usecase';
import GetChequeSubmissionUseCase from '../domain/application/usecases/get-cheque-submission.usecase';
import GetLatestBankAccountValidationUseCase from '../domain/application/usecases/get-latest-bank-account-validation.usecase';
import InitiatePaymentUseCase from '../domain/application/usecases/initiate-payment.usecase';
import ListChequeReviewsUseCase from '../domain/application/usecases/list-cheque-reviews.usecase';
import MarkPaymentPaidUseCase from '../domain/application/usecases/mark-payment-paid.usecase';
import RejectChequePaymentUseCase from '../domain/application/usecases/reject-cheque-payment.usecase';
import SubmitChequeVerificationUseCase from '../domain/application/usecases/submit-cheque-verification.usecase';
import ValidateBankAccountUseCase from '../domain/application/usecases/validate-bank-account.usecase';
import PaymentsInfrastructureModule from '../infrastructure/infrastructure.module';
import AdminPaymentsController from './http/controllers/admin-payments.controller';
import PaymentsController from './http/controllers/payments.controller';

@Module({
  imports: [
    PaymentsInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
    OrdersModule,
  ],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [
    PaymentMethodRegistry,
    ChequeMediaPresenter,
    ChequeSubmissionPresenter,
    InitiatePaymentUseCase,
    MarkPaymentPaidUseCase,
    SubmitChequeVerificationUseCase,
    GetChequeSubmissionUseCase,
    ListChequeReviewsUseCase,
    ApproveChequePaymentUseCase,
    RejectChequePaymentUseCase,
    ValidateBankAccountUseCase,
    GetLatestBankAccountValidationUseCase,
  ],
  exports: [InitiatePaymentUseCase, MarkPaymentPaidUseCase],
})
export default class PaymentsModule {}
