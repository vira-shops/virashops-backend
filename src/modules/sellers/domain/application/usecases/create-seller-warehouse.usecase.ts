import { Inject, Injectable } from '@nestjs/common';
import InvalidSellerFieldError from '../../errors/invalid-seller-field.error';
import SellerNotFoundError from '../../errors/seller-not-found.error';
import SellerWarehouse from '../../model/seller-warehouse.model';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import type SellerWarehouseRepositoryPort from '../../ports/seller-warehouse.repository.port';
import type { SellerWarehouseView } from '../../view-models/seller-profile.view';
import {
  SELLER_REPOSITORY,
  SELLER_WAREHOUSE_REPOSITORY,
} from '../../../shared/tokens/port.token';
import CreateSellerWarehouseCommand from '../commands/create-seller-warehouse.command';

@Injectable()
export default class CreateSellerWarehouseUseCase {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
    @Inject(SELLER_WAREHOUSE_REPOSITORY)
    private readonly warehouses: SellerWarehouseRepositoryPort,
  ) {}

  async execute(
    command: CreateSellerWarehouseCommand,
  ): Promise<SellerWarehouseView> {
    this.assertPostalCode(command.postalCode);
    const seller = await this.sellers.findByUserId(command.userId);
    if (!seller) {
      throw new SellerNotFoundError();
    }
    const existing = await this.warehouses.listBySellerId(seller.getId());
    const saved = await this.warehouses.save(
      SellerWarehouse.create({
        sellerId: seller.getId(),
        phone: command.phone,
        postalCode: command.postalCode,
        city: command.city,
        address: command.address,
        sortOrder: existing.length,
      }),
    );
    return saved.toView();
  }

  private assertPostalCode(postalCode?: string | null): void {
    if (
      postalCode !== undefined &&
      postalCode !== null &&
      postalCode !== '' &&
      !/^\d{10}$/.test(postalCode)
    ) {
      throw new InvalidSellerFieldError('Postal code must be 10 digits');
    }
  }
}
