import { Inject, Injectable } from '@nestjs/common';
import AddressNotFoundError from '../../errors/address-not-found.error';
import Address from '../../model/address.model';
import type AddressRepositoryPort from '../../ports/address.repository.port';
import { ADDRESS_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class GetAddressForUserUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addresses: AddressRepositoryPort,
  ) {}

  async execute(addressId: number, userId: number): Promise<Address> {
    const address = await this.addresses.findByIdForUser(addressId, userId);
    if (!address) {
      throw new AddressNotFoundError();
    }
    return address;
  }
}
