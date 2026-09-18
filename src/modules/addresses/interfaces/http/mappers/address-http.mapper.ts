import Address from '../../../domain/model/address.model';
import CreateAddressCommand from '../../../domain/application/commands/create-address.command';
import UpdateAddressCommand from '../../../domain/application/commands/update-address.command';
import UpsertAddressHttpDto from '../dto/upsert-address.http-dto';

export default class AddressHttpMapper {
  static toCreateCommand(userId: number, dto: UpsertAddressHttpDto) {
    return new CreateAddressCommand(
      userId,
      dto.label,
      dto.line1,
      dto.line2 ?? null,
      dto.city,
      dto.province,
      dto.postalCode ?? null,
      dto.isDefault ?? false,
    );
  }

  static toUpdateCommand(
    userId: number,
    addressId: number,
    dto: UpsertAddressHttpDto,
  ) {
    return new UpdateAddressCommand(
      userId,
      addressId,
      dto.label,
      dto.line1,
      dto.line2 ?? null,
      dto.city,
      dto.province,
      dto.postalCode ?? null,
      dto.isDefault ?? false,
    );
  }

  static toResponse(address: Address) {
    return {
      id: address.getId(),
      label: address.getLabel(),
      line1: address.getLine1(),
      line2: address.getLine2(),
      city: address.getCity(),
      province: address.getProvince(),
      postalCode: address.getPostalCode(),
      isDefault: address.isDefault(),
    };
  }
}
