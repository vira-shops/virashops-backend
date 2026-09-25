import { Inject, Injectable } from '@nestjs/common';
import AccountNotFoundError from '../../errors/account-not-found.error';
import BuyerProfile from '../../model/buyer-profile.model';
import type BuyerProfileRepositoryPort from '../../ports/buyer-profile.repository.port';
import type UserRepositoryPort from '../../ports/user.repository.port';
import {
  BUYER_PROFILE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../shared/tokens/port.token';
import GetBuyerProfileQuery from '../queries/get-buyer-profile.query';
import BuyerProfileViewMapper, {
  type BuyerProfileView,
} from '../../view-models/buyer-profile.view';

@Injectable()
export default class GetBuyerProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(BUYER_PROFILE_REPOSITORY)
    private readonly profiles: BuyerProfileRepositoryPort,
  ) {}

  async execute(query: GetBuyerProfileQuery): Promise<BuyerProfileView> {
    const user = await this.users.findById(query.userId);
    if (!user) {
      throw new AccountNotFoundError();
    }
    const profile = await this.profiles.findByUserId(query.userId);
    return BuyerProfileViewMapper.toView(user, profile);
  }

  async ensureProfile(userId: number): Promise<BuyerProfile> {
    const existing = await this.profiles.findByUserId(userId);
    if (existing) {
      return existing;
    }
    return this.profiles.save(BuyerProfile.createEmpty(userId));
  }
}
