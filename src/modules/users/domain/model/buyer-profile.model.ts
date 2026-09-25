import BuyerGender from './enums/buyer-gender.enum';
import BuyerIdentityType from './enums/buyer-identity-type.enum';

export type BuyerProfileProps = {
  id: number | null;
  userId: number;
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

export default class BuyerProfile {
  private constructor(private props: BuyerProfileProps) {}

  static createEmpty(userId: number): BuyerProfile {
    return new BuyerProfile({
      id: null,
      userId,
      nationalId: null,
      dateOfBirth: null,
      gender: null,
      avatarKey: null,
      businessName: null,
      businessPhone: null,
      postalCode: null,
      province: null,
      city: null,
      address: null,
      identityType: null,
      documentKey1: null,
      documentKey2: null,
    });
  }

  static restore(props: BuyerProfileProps): BuyerProfile {
    return new BuyerProfile({ ...props });
  }

  getId(): number | null {
    return this.props.id;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getNationalId(): string | null {
    return this.props.nationalId;
  }

  getDateOfBirth(): string | null {
    return this.props.dateOfBirth;
  }

  getGender(): BuyerGender | null {
    return this.props.gender;
  }

  getAvatarKey(): string | null {
    return this.props.avatarKey;
  }

  getBusinessName(): string | null {
    return this.props.businessName;
  }

  getBusinessPhone(): string | null {
    return this.props.businessPhone;
  }

  getPostalCode(): string | null {
    return this.props.postalCode;
  }

  getProvince(): string | null {
    return this.props.province;
  }

  getCity(): string | null {
    return this.props.city;
  }

  getAddress(): string | null {
    return this.props.address;
  }

  getIdentityType(): BuyerIdentityType | null {
    return this.props.identityType;
  }

  getDocumentKey1(): string | null {
    return this.props.documentKey1;
  }

  getDocumentKey2(): string | null {
    return this.props.documentKey2;
  }

  update(input: Partial<Omit<BuyerProfileProps, 'id' | 'userId'>>): void {
    this.props = {
      ...this.props,
      nationalId:
        input.nationalId !== undefined
          ? input.nationalId?.trim() || null
          : this.props.nationalId,
      dateOfBirth:
        input.dateOfBirth !== undefined
          ? input.dateOfBirth?.trim() || null
          : this.props.dateOfBirth,
      gender: input.gender !== undefined ? input.gender : this.props.gender,
      avatarKey:
        input.avatarKey !== undefined
          ? input.avatarKey?.trim() || null
          : this.props.avatarKey,
      businessName:
        input.businessName !== undefined
          ? input.businessName?.trim() || null
          : this.props.businessName,
      businessPhone:
        input.businessPhone !== undefined
          ? input.businessPhone?.trim() || null
          : this.props.businessPhone,
      postalCode:
        input.postalCode !== undefined
          ? input.postalCode?.trim() || null
          : this.props.postalCode,
      province:
        input.province !== undefined
          ? input.province?.trim() || null
          : this.props.province,
      city:
        input.city !== undefined ? input.city?.trim() || null : this.props.city,
      address:
        input.address !== undefined
          ? input.address?.trim() || null
          : this.props.address,
      identityType:
        input.identityType !== undefined
          ? input.identityType
          : this.props.identityType,
      documentKey1:
        input.documentKey1 !== undefined
          ? input.documentKey1?.trim() || null
          : this.props.documentKey1,
      documentKey2:
        input.documentKey2 !== undefined
          ? input.documentKey2?.trim() || null
          : this.props.documentKey2,
    };
  }

  toSnapshot(): BuyerProfileProps {
    return { ...this.props };
  }
}
