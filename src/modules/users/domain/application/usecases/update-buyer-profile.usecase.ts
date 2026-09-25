import { Inject, Injectable } from '@nestjs/common';
import AccountNotFoundError from '../../errors/account-not-found.error';
import BuyerProfile from '../../model/buyer-profile.model';
import type BuyerProfileRepositoryPort from '../../ports/buyer-profile.repository.port';
import type UserRepositoryPort from '../../ports/user.repository.port';
import {
  BUYER_PROFILE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../shared/tokens/port.token';
import UpdateBuyerProfileCommand from '../commands/update-buyer-profile.command';
import BuyerProfileViewMapper, {
  type BuyerProfileView,
} from '../../view-models/buyer-profile.view';

@Injectable()
export default class UpdateBuyerProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(BUYER_PROFILE_REPOSITORY)
    private readonly profiles: BuyerProfileRepositoryPort,
  ) {}

  async execute(command: UpdateBuyerProfileCommand): Promise<BuyerProfileView> {
    const user = await this.users.findById(command.userId);
    if (!user) {
      throw new AccountNotFoundError();
    }

    if (command.firstName !== undefined || command.lastName !== undefined) {
      user.rename(
        command.firstName ?? user.getFirstName(),
        command.lastName ?? user.getLastName(),
      );
      await this.users.save(user);
    }

    let profile = await this.profiles.findByUserId(command.userId);
    if (!profile) {
      profile = BuyerProfile.createEmpty(command.userId);
    }
    profile.update({
      nationalId: command.nationalId,
      dateOfBirth: command.dateOfBirth,
      gender: command.gender,
      avatarKey: command.avatarKey,
      businessName: command.businessName,
      businessPhone: command.businessPhone,
      postalCode: command.postalCode,
      province: command.province,
      city: command.city,
      address: command.address,
      identityType: command.identityType,
      documentKey1: command.documentKey1,
      documentKey2: command.documentKey2,
    });
    const saved = await this.profiles.save(profile);
    return BuyerProfileViewMapper.toView(user, saved);
  }
}
