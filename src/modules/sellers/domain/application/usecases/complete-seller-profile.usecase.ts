import { Inject, Injectable } from '@nestjs/common';
import InvalidSellerFieldError from '../../errors/invalid-seller-field.error';
import SellerNotFoundError from '../../errors/seller-not-found.error';
import SalesType from '../../model/enums/sales-type.enum';
import Seller from '../../model/seller.model';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import { SELLER_REPOSITORY } from '../../../shared/tokens/port.token';
import CompleteSellerProfileCommand from '../commands/complete-seller-profile.command';

@Injectable()
export default class CompleteSellerProfileUseCase {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
  ) {}

  async execute(command: CompleteSellerProfileCommand): Promise<Seller> {
    const seller = await this.sellers.findByUserId(command.userId);
    if (!seller) {
      throw new SellerNotFoundError();
    }
    if (!command.shopName.trim()) {
      throw new InvalidSellerFieldError('Shop name is required');
    }
    if (!command.province.trim() || !command.city.trim()) {
      throw new InvalidSellerFieldError('Province and city are required');
    }
    if (!command.address.trim()) {
      throw new InvalidSellerFieldError('Workplace address is required');
    }
    if (!Object.values(SalesType).includes(command.salesType)) {
      throw new InvalidSellerFieldError('Sales type is required');
    }
    if (command.postalCode && !/^\d{10}$/.test(command.postalCode)) {
      throw new InvalidSellerFieldError('Postal code must be 10 digits');
    }

    seller.completeProfile({
      shopName: command.shopName,
      workplacePhone: command.workplacePhone,
      province: command.province,
      city: command.city,
      postalCode: command.postalCode,
      salesType: command.salesType,
      address: command.address,
    });
    return this.sellers.save(seller);
  }
}
