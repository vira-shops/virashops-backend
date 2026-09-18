import { Inject, Injectable } from '@nestjs/common';
import AddressNotFoundError from '../../errors/address-not-found.error';
import type AddressRepositoryPort from '../../ports/address.repository.port';
import { ADDRESS_REPOSITORY } from '../../../shared/tokens/port.token';
import DeleteAddressCommand from '../commands/delete-address.command';

@Injectable()
export default class DeleteAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addresses: AddressRepositoryPort,
  ) {}

  async execute(command: DeleteAddressCommand): Promise<void> {
    const address = await this.addresses.findByIdForUser(
      command.addressId,
      command.userId,
    );
    if (!address) {
      throw new AddressNotFoundError();
    }
    await this.addresses.deleteByIdForUser(command.addressId, command.userId);
  }
}
