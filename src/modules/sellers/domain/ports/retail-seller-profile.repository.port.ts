import RetailSellerProfile from '../model/retail-seller-profile.model';

export default interface RetailSellerProfileRepositoryPort {
  findByUserId(userId: number): Promise<RetailSellerProfile | null>;
  save(profile: RetailSellerProfile): Promise<RetailSellerProfile>;
}
