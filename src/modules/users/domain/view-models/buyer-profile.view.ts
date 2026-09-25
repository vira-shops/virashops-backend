import BuyerGender from '../model/enums/buyer-gender.enum';
import BuyerIdentityType from '../model/enums/buyer-identity-type.enum';
import BuyerProfile from '../model/buyer-profile.model';
import User from '../model/user.model';

export type BuyerProfileView = {
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: BuyerGender | null;
  avatarKey: string | null;
  businessName: string | null;
  businessPhone: string | null;
  postalCode: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  identityType: BuyerIdentityType | null;
  documentKey1: string | null;
  documentKey2: string | null;
};

export default class BuyerProfileViewMapper {
  static toView(user: User, profile: BuyerProfile | null): BuyerProfileView {
    return {
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      phone: user.getPhone(),
      nationalId: profile?.getNationalId() ?? null,
      dateOfBirth: profile?.getDateOfBirth() ?? null,
      gender: profile?.getGender() ?? null,
      avatarKey: profile?.getAvatarKey() ?? null,
      businessName: profile?.getBusinessName() ?? null,
      businessPhone: profile?.getBusinessPhone() ?? null,
      postalCode: profile?.getPostalCode() ?? null,
      province: profile?.getProvince() ?? null,
      city: profile?.getCity() ?? null,
      address: profile?.getAddress() ?? null,
      identityType: profile?.getIdentityType() ?? null,
      documentKey1: profile?.getDocumentKey1() ?? null,
      documentKey2: profile?.getDocumentKey2() ?? null,
    };
  }
}
