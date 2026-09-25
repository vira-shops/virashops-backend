import { Inject, Injectable } from '@nestjs/common';
import AccountNotFoundError from '../../../../users/domain/errors/account-not-found.error';
import type UserRepositoryPort from '../../../../users/domain/ports/user.repository.port';
import User from '../../../../users/domain/model/user.model';
import { USER_REPOSITORY } from '../../../../users/shared/tokens/port.token';
import InvalidSellerFieldError from '../../errors/invalid-seller-field.error';
import RetailSellerProfile from '../../model/retail-seller-profile.model';
import SellerGender from '../../model/enums/seller-gender.enum';
import type RetailSellerProfileRepositoryPort from '../../ports/retail-seller-profile.repository.port';
import { RETAIL_SELLER_PROFILE_REPOSITORY } from '../../../shared/tokens/port.token';
import type { RetailSellerProfileView } from '../../view-models/seller-profile.view';
import UpdateRetailSellerProfileCommand from '../commands/update-retail-seller-profile.command';

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
export default class UpdateRetailSellerProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(RETAIL_SELLER_PROFILE_REPOSITORY)
    private readonly profiles: RetailSellerProfileRepositoryPort,
  ) {}

  async execute(
    command: UpdateRetailSellerProfileCommand,
  ): Promise<RetailSellerProfileView> {
    const user = await this.users.findById(command.userId);
    if (!user) {
      throw new AccountNotFoundError();
    }
    this.assert(command);

    if (command.firstName !== undefined || command.lastName !== undefined) {
      user.rename(
        command.firstName ?? user.getFirstName(),
        command.lastName ?? user.getLastName(),
      );
      await this.users.save(user);
    }

    const profile =
      (await this.profiles.findByUserId(command.userId)) ??
      RetailSellerProfile.createEmpty(command.userId);
    profile.patch({
      email: command.email,
      nationalId: command.nationalId,
      dateOfBirth: command.dateOfBirth,
      gender: command.gender,
      province: command.province,
      city: command.city,
      occupation: command.occupation,
      address: command.address,
      postalCode: command.postalCode,
      latitude: command.latitude,
      longitude: command.longitude,
      avatarKey: command.avatarKey,
    });
    const saved = await this.profiles.save(profile);
    return toView(user, saved);
  }

  private assert(command: UpdateRetailSellerProfileCommand): void {
    if (
      command.email !== undefined &&
      command.email !== null &&
      command.email !== '' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(command.email)
    ) {
      throw new InvalidSellerFieldError('Email is invalid');
    }
    if (
      command.nationalId !== undefined &&
      command.nationalId !== null &&
      command.nationalId !== '' &&
      !/^\d{10}$/.test(command.nationalId)
    ) {
      throw new InvalidSellerFieldError('National ID must be 10 digits');
    }
    if (
      command.postalCode !== undefined &&
      command.postalCode !== null &&
      command.postalCode !== '' &&
      !/^\d{10}$/.test(command.postalCode)
    ) {
      throw new InvalidSellerFieldError('Postal code must be 10 digits');
    }
    if (
      command.gender !== undefined &&
      command.gender !== null &&
      !Object.values(SellerGender).includes(command.gender)
    ) {
      throw new InvalidSellerFieldError('Invalid gender');
    }
    if (
      command.latitude !== undefined &&
      command.latitude !== null &&
      (command.latitude < -90 || command.latitude > 90)
    ) {
      throw new InvalidSellerFieldError('Latitude must be between -90 and 90');
    }
    if (
      command.longitude !== undefined &&
      command.longitude !== null &&
      (command.longitude < -180 || command.longitude > 180)
    ) {
      throw new InvalidSellerFieldError(
        'Longitude must be between -180 and 180',
      );
    }
  }
}
