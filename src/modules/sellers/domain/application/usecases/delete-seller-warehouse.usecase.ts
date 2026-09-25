import { Inject, Injectable } from '@nestjs/common';
import SellerNotFoundError from '../../errors/seller-not-found.error';
import SellerWarehouseNotFoundError from '../../errors/seller-warehouse-not-found.error';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import type SellerWarehouseRepositoryPort from '../../ports/seller-warehouse.repository.port';
import {
  SELLER_REPOSITORY,
  SELLER_WAREHOUSE_REPOSITORY,
} from '../../../shared/tokens/port.token';
import DeleteSellerWarehouseCommand from '../commands/delete-seller-warehouse.command';

@Injectable()
export default class DeleteSellerWarehouseUseCase {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
    @Inject(SELLER_WAREHOUSE_REPOSITORY)
    private readonly warehouses: SellerWarehouseRepositoryPort,
  ) {}

  async execute(command: DeleteSellerWarehouseCommand): Promise<void> {
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
    await this.warehouses.softDelete(command.warehouseId, seller.getId());
  }
}
