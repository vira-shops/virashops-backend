import { Inject, Injectable } from '@nestjs/common';
import type AddressRepositoryPort from '../../ports/address.repository.port';
import { ADDRESS_REPOSITORY } from '../../../shared/tokens/port.token';
import ListAddressesQuery from '../queries/list-addresses.query';

@Injectable()
export default class ListAddressesUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addresses: AddressRepositoryPort,
  ) {}

  async execute(query: ListAddressesQuery) {
    return this.addresses.listByUserId(query.userId);
  }
}
