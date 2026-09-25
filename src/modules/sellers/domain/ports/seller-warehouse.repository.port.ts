import SellerWarehouse from '../model/seller-warehouse.model';

export default interface SellerWarehouseRepositoryPort {
  listBySellerId(sellerId: number): Promise<SellerWarehouse[]>;
  findByIdForSeller(
    id: number,
    sellerId: number,
  ): Promise<SellerWarehouse | null>;
  save(warehouse: SellerWarehouse): Promise<SellerWarehouse>;
  softDelete(id: number, sellerId: number): Promise<void>;
}
