import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type TokenServicePort from '../../../../shared/application/ports/token-service.port';
import { TOKEN_SERVICE } from '../../../../shared/tokens/port.tokens';
import User from '../../model/user.model';
import type SellerSummaryQueryPort from '../../ports/seller-summary.query.port';
import type { SellerSummary } from '../../ports/seller-summary.query.port';
import AuthSession from '../../view-models/auth-session.view-model';
import { SELLER_SUMMARY_QUERY } from '../../../shared/tokens/port.token';

export type JwtPayload = {
  sub: string;
  phone: string;
  roles: string[];
  jti: string;
  exp?: number;
};

@Injectable()
export default class IssueSessionUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokens: TokenServicePort,
    @Optional()
    @Inject(SELLER_SUMMARY_QUERY)
    private readonly sellers?: SellerSummaryQueryPort,
  ) {}

  async execute(
    user: User,
    seller?: SellerSummary | null,
  ): Promise<AuthSession> {
    const accessToken = await this.tokens.sign({
      sub: String(user.getId()),
      phone: user.getPhone(),
      roles: user.getRoles(),
      jti: randomUUID(),
    });

    const resolvedSeller =
      seller !== undefined
        ? seller
        : this.sellers
          ? await this.sellers.findByUserId(user.getId())
          : null;

    return new AuthSession(accessToken, user, resolvedSeller);
  }
}
