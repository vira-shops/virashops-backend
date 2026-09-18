import { Inject, Injectable } from '@nestjs/common';
import Address from '../../model/address.model';
import type AddressRepositoryPort from '../../ports/address.repository.port';
import { ADDRESS_REPOSITORY } from '../../../shared/tokens/port.token';
import CreateAddressCommand from '../commands/create-address.command';

@Injectable()
export default class CreateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addresses: AddressRepositoryPort,
  ) {}

  async execute(command: CreateAddressCommand): Promise<Address> {
    if (command.isDefault) {
      await this.addresses.clearDefaultForUser(command.userId);
    }
    const address = Address.create({
      userId: command.userId,
      label: command.label,
      line1: command.line1,
      line2: command.line2,
      city: command.city,
      province: command.province,
      postalCode: command.postalCode,
      isDefault: command.isDefault,
    });
    return this.addresses.save(address);
  }
}
