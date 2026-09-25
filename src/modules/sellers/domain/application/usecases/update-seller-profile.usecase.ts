import { Inject, Injectable } from '@nestjs/common';
import AccountNotFoundError from '../../../../users/domain/errors/account-not-found.error';
import type UserRepositoryPort from '../../../../users/domain/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../../users/shared/tokens/port.token';
import InvalidSellerFieldError from '../../errors/invalid-seller-field.error';
import SellerNotFoundError from '../../errors/seller-not-found.error';
import SalesType from '../../model/enums/sales-type.enum';
import SellerGender from '../../model/enums/seller-gender.enum';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import type SellerWarehouseRepositoryPort from '../../ports/seller-warehouse.repository.port';
import {
  SELLER_REPOSITORY,
  SELLER_WAREHOUSE_REPOSITORY,
} from '../../../shared/tokens/port.token';
import type { SellerProfileView } from '../../view-models/seller-profile.view';
import UpdateSellerProfileCommand from '../commands/update-seller-profile.command';

@Injectable()
export default class UpdateSellerProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
    @Inject(SELLER_WAREHOUSE_REPOSITORY)
    private readonly warehouses: SellerWarehouseRepositoryPort,
  ) {}

  async execute(
    command: UpdateSellerProfileCommand,
  ): Promise<SellerProfileView> {
    const user = await this.users.findById(command.userId);
    if (!user) {
      throw new AccountNotFoundError();
    }
    const seller = await this.sellers.findByUserId(command.userId);
    if (!seller) {
      throw new SellerNotFoundError();
    }

    if (command.firstName !== undefined || command.lastName !== undefined) {
      user.rename(
        command.firstName ?? user.getFirstName(),
        command.lastName ?? user.getLastName(),
      );
      await this.users.save(user);
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
      command.nationalId !== undefined &&
      command.nationalId !== null &&
      command.nationalId !== '' &&
      !/^\d{10}$/.test(command.nationalId)
    ) {
      throw new InvalidSellerFieldError('National ID must be 10 digits');
    }
    if (
      command.salesType !== undefined &&
      command.salesType !== null &&
      !Object.values(SalesType).includes(command.salesType)
    ) {
      throw new InvalidSellerFieldError('Invalid sales type');
    }
    if (
      command.gender !== undefined &&
      command.gender !== null &&
      !Object.values(SellerGender).includes(command.gender)
    ) {
      throw new InvalidSellerFieldError('Invalid gender');
    }

    seller.patchProfile({
      shopName: command.shopName,
      workplacePhone: command.workplacePhone,
      province: command.province,
      city: command.city,
      postalCode: command.postalCode,
      salesType: command.salesType,
      address: command.address,
      industryType: command.industryType,
      category: command.category,
      activityType: command.activityType,
      documentType: command.documentType,
      documentKey: command.documentKey,
      nationalId: command.nationalId,
      dateOfBirth: command.dateOfBirth,
      gender: command.gender,
      avatarKey: command.avatarKey,
    });
    const saved = await this.sellers.save(seller);
    const warehouseRows = await this.warehouses.listBySellerId(saved.getId());
    return {
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      phone: user.getPhone(),
      nationalId: saved.getNationalId(),
      dateOfBirth: saved.getDateOfBirth(),
      gender: saved.getGender(),
      avatarKey: saved.getAvatarKey(),
      shopName: saved.getShopName(),
      workplacePhone: saved.getWorkplacePhone(),
      province: saved.getProvince(),
      city: saved.getCity(),
      postalCode: saved.getPostalCode(),
      salesType: saved.getSalesType(),
      address: saved.getAddress(),
      industryType: saved.getIndustryType(),
      category: saved.getCategory(),
      activityType: saved.getActivityType(),
      documentType: saved.getDocumentType(),
      documentKey: saved.getDocumentKey(),
      status: saved.getStatus(),
      profileComplete: saved.isProfileComplete(),
      warehouses: warehouseRows.map((row) => row.toView()),
    };
  }
}
