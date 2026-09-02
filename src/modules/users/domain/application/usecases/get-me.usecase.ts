import { Inject, Injectable, Optional } from '@nestjs/common';
import AccountNotFoundError from '../../errors/account-not-found.error';
import GetMeQuery from '../queries/get-me.query';
import User from '../../model/user.model';
import type SellerSummaryQueryPort from '../../ports/seller-summary.query.port';
import type { SellerSummary } from '../../ports/seller-summary.query.port';
import type UserRepositoryPort from '../../ports/user.repository.port';
import {
  SELLER_SUMMARY_QUERY,
  USER_REPOSITORY,
} from '../../../shared/tokens/port.token';

export type MeResult = {
  user: User;
  seller: SellerSummary | null;
};

@Injectable()
export default class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Optional()
    @Inject(SELLER_SUMMARY_QUERY)
    private readonly sellers?: SellerSummaryQueryPort,
  ) {}

  async execute(query: GetMeQuery): Promise<MeResult> {
    const user = await this.users.findById(query.userId);
    if (!user) {
      throw new AccountNotFoundError();
    }

    const seller = this.sellers
      ? await this.sellers.findByUserId(user.getId())
      : null;

    return { user, seller };
  }
}
