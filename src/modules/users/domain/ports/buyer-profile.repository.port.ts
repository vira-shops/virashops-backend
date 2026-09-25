import BuyerProfile from '../model/buyer-profile.model';

export default interface BuyerProfileRepositoryPort {
  findByUserId(userId: number): Promise<BuyerProfile | null>;
  save(profile: BuyerProfile): Promise<BuyerProfile>;
}
