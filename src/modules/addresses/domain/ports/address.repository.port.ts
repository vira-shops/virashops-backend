import Address from '../model/address.model';

export default interface AddressRepositoryPort {
  findByIdForUser(id: number, userId: number): Promise<Address | null>;
  listByUserId(userId: number): Promise<Address[]>;
  save(address: Address): Promise<Address>;
  deleteByIdForUser(id: number, userId: number): Promise<void>;
  clearDefaultForUser(userId: number): Promise<void>;
}
