import BuyerProfile from '../../../domain/model/buyer-profile.model';
import BuyerGender from '../../../domain/model/enums/buyer-gender.enum';
import BuyerIdentityType from '../../../domain/model/enums/buyer-identity-type.enum';
import type { BuyerProfileRow } from '../schema/buyer-profiles';

export default class BuyerProfileMapper {
  static toDomain(row: BuyerProfileRow): BuyerProfile {
    return BuyerProfile.restore({
      id: row.id,
      userId: row.userId,
      nationalId: row.nationalId,
      dateOfBirth: row.dateOfBirth,
      gender: row.gender as BuyerGender | null,
      avatarKey: row.avatarKey,
      businessName: row.businessName,
      businessPhone: row.businessPhone,
      postalCode: row.postalCode,
      province: row.province,
      city: row.city,
      address: row.address,
      identityType: row.identityType as BuyerIdentityType | null,
      documentKey1: row.documentKey1,
      documentKey2: row.documentKey2,
    });
  }
}
