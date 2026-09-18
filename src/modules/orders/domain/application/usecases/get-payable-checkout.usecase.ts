import { Inject, Injectable } from '@nestjs/common';
import CheckoutSessionNotFoundError from '../../errors/checkout-session-not-found.error';
import CheckoutSession from '../../model/checkout-session.model';
import type CheckoutSessionRepositoryPort from '../../ports/checkout-session.repository.port';
import { CHECKOUT_SESSION_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class GetPayableCheckoutUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_REPOSITORY)
    private readonly sessions: CheckoutSessionRepositoryPort,
  ) {}

  async execute(sessionId: number, userId: number): Promise<CheckoutSession> {
    const session = await this.sessions.findByIdForUser(sessionId, userId);
    if (!session) {
      throw new CheckoutSessionNotFoundError();
    }
    session.assertPayable();
    return session;
  }
}
