import { Inject, Injectable } from '@nestjs/common';
import AccountNotFoundError from '../../../../users/domain/errors/account-not-found.error';
import type UserRepositoryPort from '../../../../users/domain/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../../users/shared/tokens/port.token';
import SellerNotFoundError from '../../errors/seller-not-found.error';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import type SellerWarehouseRepositoryPort from '../../ports/seller-warehouse.repository.port';
import {
  SELLER_REPOSITORY,
  SELLER_WAREHOUSE_REPOSITORY,
} from '../../../shared/tokens/port.token';
import type { SellerProfileView } from '../../view-models/seller-profile.view';
import GetSellerProfileQuery from '../queries/get-seller-profile.query';

@Injectable()
export default class GetSellerProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
    @Inject(SELLER_WAREHOUSE_REPOSITORY)
    private readonly warehouses: SellerWarehouseRepositoryPort,
  ) {}

  async execute(query: GetSellerProfileQuery): Promise<SellerProfileView> {
    const user = await this.users.findById(query.userId);
    if (!user) {
      throw new AccountNotFoundError();
    }
    const seller = await this.sellers.findByUserId(query.userId);
    if (!seller) {
      throw new SellerNotFoundError();
    }
    const warehouseRows = await this.warehouses.listBySellerId(seller.getId());
    return {
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      phone: user.getPhone(),
      nationalId: seller.getNationalId(),
      dateOfBirth: seller.getDateOfBirth(),
      gender: seller.getGender(),
      avatarKey: seller.getAvatarKey(),
      shopName: seller.getShopName(),
      workplacePhone: seller.getWorkplacePhone(),
      province: seller.getProvince(),
      city: seller.getCity(),
      postalCode: seller.getPostalCode(),
      salesType: seller.getSalesType(),
      address: seller.getAddress(),
      industryType: seller.getIndustryType(),
      category: seller.getCategory(),
      activityType: seller.getActivityType(),
      documentType: seller.getDocumentType(),
      documentKey: seller.getDocumentKey(),
      status: seller.getStatus(),
      profileComplete: seller.isProfileComplete(),
      warehouses: warehouseRows.map((row) => row.toView()),
    };
  }
}
