import { Inject, Injectable } from '@nestjs/common';
import AddressNotFoundError from '../../errors/address-not-found.error';
import type AddressRepositoryPort from '../../ports/address.repository.port';
import { ADDRESS_REPOSITORY } from '../../../shared/tokens/port.token';
import UpdateAddressCommand from '../commands/update-address.command';

@Injectable()
export default class UpdateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addresses: AddressRepositoryPort,
  ) {}

  async execute(command: UpdateAddressCommand) {
    const address = await this.addresses.findByIdForUser(
      command.addressId,
      command.userId,
    );
    if (!address) {
      throw new AddressNotFoundError();
    }
    if (command.isDefault) {
      await this.addresses.clearDefaultForUser(command.userId);
    }
    address.update({
      label: command.label,
      line1: command.line1,
      line2: command.line2,
      city: command.city,
      province: command.province,
      postalCode: command.postalCode,
      recipientFullName: command.recipientFullName,
      recipientPhone: command.recipientPhone,
      nationalId: command.nationalId,
      houseNumber: command.houseNumber,
      isDefault: command.isDefault,
    });
    return this.addresses.save(address);
  }
}
