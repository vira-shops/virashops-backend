import SellerGender from './enums/seller-gender.enum';

export type RetailSellerProfileProps = {
  id: number | null;
  userId: number;
  email: string | null;
  occupation: string | null;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: SellerGender | null;
  avatarKey: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default class RetailSellerProfile {
  private constructor(private props: RetailSellerProfileProps) {}

  static createEmpty(userId: number): RetailSellerProfile {
    return new RetailSellerProfile({
      id: null,
      userId,
      email: null,
      occupation: null,
      nationalId: null,
      dateOfBirth: null,
      gender: null,
      avatarKey: null,
      province: null,
      city: null,
      address: null,
      postalCode: null,
      latitude: null,
      longitude: null,
    });
  }

  static restore(props: RetailSellerProfileProps): RetailSellerProfile {
    return new RetailSellerProfile({ ...props });
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Retail seller profile has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getEmail(): string | null {
    return this.props.email;
  }

  getOccupation(): string | null {
    return this.props.occupation;
  }

  getNationalId(): string | null {
    return this.props.nationalId;
  }

  getDateOfBirth(): string | null {
    return this.props.dateOfBirth;
  }

  getGender(): SellerGender | null {
    return this.props.gender;
  }

  getAvatarKey(): string | null {
    return this.props.avatarKey;
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

  getPostalCode(): string | null {
    return this.props.postalCode;
  }

  getLatitude(): number | null {
    return this.props.latitude;
  }

  getLongitude(): number | null {
    return this.props.longitude;
  }

  patch(input: Partial<Omit<RetailSellerProfileProps, 'id' | 'userId'>>): void {
    const trim = (value: string | null | undefined) => value?.trim() || null;
    if (input.email !== undefined) {
      this.props.email = trim(input.email);
    }
    if (input.occupation !== undefined) {
      this.props.occupation = trim(input.occupation);
    }
    if (input.nationalId !== undefined) {
      this.props.nationalId = trim(input.nationalId);
    }
    if (input.dateOfBirth !== undefined) {
      this.props.dateOfBirth = trim(input.dateOfBirth);
    }
    if (input.gender !== undefined) {
      this.props.gender = input.gender;
    }
    if (input.avatarKey !== undefined) {
      this.props.avatarKey = trim(input.avatarKey);
    }
    if (input.province !== undefined) {
      this.props.province = trim(input.province);
    }
    if (input.city !== undefined) {
      this.props.city = trim(input.city);
    }
    if (input.address !== undefined) {
      this.props.address = trim(input.address);
    }
    if (input.postalCode !== undefined) {
      this.props.postalCode = trim(input.postalCode);
    }
    if (input.latitude !== undefined) {
      this.props.latitude = input.latitude;
    }
    if (input.longitude !== undefined) {
      this.props.longitude = input.longitude;
    }
  }

  toSnapshot(): RetailSellerProfileProps {
    return { ...this.props };
  }
}
