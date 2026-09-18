import { Inject, Injectable } from '@nestjs/common';
import GetPayableCheckoutUseCase from '../../../../orders/domain/application/usecases/get-payable-checkout.usecase';
import BankCreditInsufficientError from '../../errors/bank-credit-insufficient.error';
import BankValidationRequiredError from '../../errors/bank-validation-required.error';
import Payment from '../../model/payment.model';
import PaymentMethodName from '../../model/enums/payment-method.enum';
import PaymentMethodUnavailableError from '../../errors/payment-method-unavailable.error';
import type BankAccountValidationRepositoryPort from '../../ports/bank-account-validation.repository.port';
import type PaymentRepositoryPort from '../../ports/payment.repository.port';
import {
  BANK_ACCOUNT_VALIDATION_REPOSITORY,
  PAYMENT_REPOSITORY,
} from '../../../shared/tokens/port.token';
import PaymentMethodRegistry from '../services/payment-method.registry';
import InitiatePaymentCommand from '../commands/initiate-payment.command';

export type InitiatePaymentResultView = {
  paymentId: number;
  checkoutSessionId: number;
  amount: number;
  method: string;
  status: string;
  kind: 'redirect' | 'manual' | 'captured';
  providerRef: string;
  redirectUrl: string | null;
};

/** Checkout is wholesale-only until retail channel is modeled on sessions. */
const CHECKOUT_CHANNEL = 'WHOLESALE' as const;

@Injectable()
export default class InitiatePaymentUseCase {
  constructor(
    private readonly getPayableCheckout: GetPayableCheckoutUseCase,
    private readonly methods: PaymentMethodRegistry,
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepositoryPort,
    @Inject(BANK_ACCOUNT_VALIDATION_REPOSITORY)
    private readonly bankValidations: BankAccountValidationRepositoryPort,
  ) {}

  async execute(
    command: InitiatePaymentCommand,
  ): Promise<InitiatePaymentResultView> {
    const session = await this.getPayableCheckout.execute(
      command.checkoutSessionId,
      command.userId,
    );
    const method = this.methods.get(command.method);
    if (!method.supports(CHECKOUT_CHANNEL)) {
      throw new PaymentMethodUnavailableError();
    }

    let bankAccountValidationId: number | null = null;
    if (command.method === PaymentMethodName.CHEQUE) {
      const validation = await this.bankValidations.findLatestSucceededForUser(
        command.userId,
      );
      if (!validation || !validation.isFresh()) {
        throw new BankValidationRequiredError();
      }
      if (!validation.coversAmount(session.getPayableAmount())) {
        throw new BankCreditInsufficientError();
      }
      bankAccountValidationId = validation.getId();
    }

    const payment = Payment.createPending({
      userId: command.userId,
      checkoutSessionId: session.getId(),
      method: command.method,
      amount: session.getPayableAmount(),
      bankAccountValidationId,
    });
    const saved = await this.payments.save(payment);
    const initiated = await method.initiate({
      paymentId: saved.getId(),
      checkoutSessionId: session.getId(),
      amount: saved.getAmount(),
      callbackUrl: command.callbackUrl,
      description: `Checkout ${session.getId()} seller ${session.getSellerId()}`,
    });
    saved.applyInitiation(initiated);
    const updated = await this.payments.save(saved);
    return {
      paymentId: updated.getId(),
      checkoutSessionId: updated.getCheckoutSessionId(),
      amount: updated.getAmount(),
      method: updated.getMethod(),
      status: updated.getStatus(),
      kind: initiated.kind,
      providerRef: initiated.providerRef,
      redirectUrl: initiated.kind === 'redirect' ? initiated.redirectUrl : null,
    };
  }
}
