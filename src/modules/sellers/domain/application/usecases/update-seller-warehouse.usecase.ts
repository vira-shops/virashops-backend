import { Inject, Injectable } from '@nestjs/common';
import InvalidSellerFieldError from '../../errors/invalid-seller-field.error';
import SellerNotFoundError from '../../errors/seller-not-found.error';
import SellerWarehouseNotFoundError from '../../errors/seller-warehouse-not-found.error';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import type SellerWarehouseRepositoryPort from '../../ports/seller-warehouse.repository.port';
import type { SellerWarehouseView } from '../../view-models/seller-profile.view';
import {
  SELLER_REPOSITORY,
  SELLER_WAREHOUSE_REPOSITORY,
} from '../../../shared/tokens/port.token';
import UpdateSellerWarehouseCommand from '../commands/update-seller-warehouse.command';

@Injectable()
export default class UpdateSellerWarehouseUseCase {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
    @Inject(SELLER_WAREHOUSE_REPOSITORY)
    private readonly warehouses: SellerWarehouseRepositoryPort,
  ) {}

  async execute(
    command: UpdateSellerWarehouseCommand,
  ): Promise<SellerWarehouseView> {
    if (
      command.postalCode !== undefined &&
      command.postalCode !== null &&
      command.postalCode !== '' &&
      !/^\d{10}$/.test(command.postalCode)
    ) {
      throw new InvalidSellerFieldError('Postal code must be 10 digits');
    }
    const seller = await this.sellers.findByUserId(command.userId);
    if (!seller) {
      throw new SellerNotFoundError();
    }
    const warehouse = await this.warehouses.findByIdForSeller(
      command.warehouseId,
      seller.getId(),
    );
    if (!warehouse) {
      throw new SellerWarehouseNotFoundError();
    }
    warehouse.patch({
      phone: command.phone,
      postalCode: command.postalCode,
      city: command.city,
      address: command.address,
    });
    const saved = await this.warehouses.save(warehouse);
    return saved.toView();
  }
}
