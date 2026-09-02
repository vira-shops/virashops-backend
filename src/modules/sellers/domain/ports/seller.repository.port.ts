import Seller from '../model/seller.model';

export default interface SellerRepositoryPort {
  findById(id: number): Promise<Seller | null>;
  findByUserId(userId: number): Promise<Seller | null>;
  save(seller: Seller): Promise<Seller>;
}
