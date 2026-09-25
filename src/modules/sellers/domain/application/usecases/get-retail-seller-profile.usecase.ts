import { Inject, Injectable } from '@nestjs/common';
import AccountNotFoundError from '../../../../users/domain/errors/account-not-found.error';
import type UserRepositoryPort from '../../../../users/domain/ports/user.repository.port';
import User from '../../../../users/domain/model/user.model';
import { USER_REPOSITORY } from '../../../../users/shared/tokens/port.token';
import RetailSellerProfile from '../../model/retail-seller-profile.model';
import type RetailSellerProfileRepositoryPort from '../../ports/retail-seller-profile.repository.port';
import { RETAIL_SELLER_PROFILE_REPOSITORY } from '../../../shared/tokens/port.token';
import type { RetailSellerProfileView } from '../../view-models/seller-profile.view';
import GetRetailSellerProfileQuery from '../queries/get-retail-seller-profile.query';

function toView(
  user: User,
  profile: RetailSellerProfile,
): RetailSellerProfileView {
  return {
    firstName: user.getFirstName(),
    lastName: user.getLastName(),
    phone: user.getPhone(),
    email: profile.getEmail(),
    nationalId: profile.getNationalId(),
    dateOfBirth: profile.getDateOfBirth(),
    gender: profile.getGender(),
    province: profile.getProvince(),
    city: profile.getCity(),
    occupation: profile.getOccupation(),
    address: profile.getAddress(),
    postalCode: profile.getPostalCode(),
    latitude: profile.getLatitude(),
    longitude: profile.getLongitude(),
    avatarKey: profile.getAvatarKey(),
  };
}

@Injectable()
export default class GetRetailSellerProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(RETAIL_SELLER_PROFILE_REPOSITORY)
    private readonly profiles: RetailSellerProfileRepositoryPort,
  ) {}

  async execute(
    query: GetRetailSellerProfileQuery,
  ): Promise<RetailSellerProfileView> {
    const user = await this.users.findById(query.userId);
    if (!user) {
      throw new AccountNotFoundError();
    }
    const existing = await this.profiles.findByUserId(query.userId);
    const profile =
      existing ??
      (await this.profiles.save(RetailSellerProfile.createEmpty(query.userId)));
    return toView(user, profile);
  }
}
