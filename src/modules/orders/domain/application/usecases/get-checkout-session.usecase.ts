import { Inject, Injectable } from '@nestjs/common';
import CheckoutSessionNotFoundError from '../../errors/checkout-session-not-found.error';
import type CheckoutSessionRepositoryPort from '../../ports/checkout-session.repository.port';
import { CHECKOUT_SESSION_REPOSITORY } from '../../../shared/tokens/port.token';
import GetCheckoutSessionQuery from '../queries/get-checkout-session.query';

@Injectable()
export default class GetCheckoutSessionUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_REPOSITORY)
    private readonly sessions: CheckoutSessionRepositoryPort,
  ) {}

  async execute(query: GetCheckoutSessionQuery) {
    const session = await this.sessions.findByIdForUser(
      query.sessionId,
      query.userId,
    );
    if (!session) {
      throw new CheckoutSessionNotFoundError();
    }
    return session;
  }
}
