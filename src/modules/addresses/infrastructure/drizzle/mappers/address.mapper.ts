import Address from '../../../domain/model/address.model';
import type { AddressRow } from '../schema/addresses';

export default class AddressMapper {
  static toDomain(row: AddressRow): Address {
    return Address.restore({
      id: row.id,
      userId: row.userId,
      label: row.label,
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      province: row.province,
      postalCode: row.postalCode,
      recipientFullName: row.recipientFullName,
      recipientPhone: row.recipientPhone,
      nationalId: row.nationalId,
      houseNumber: row.houseNumber,
      isDefault: row.isDefault,
    });
  }
}
