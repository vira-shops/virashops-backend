import InvalidSellerStatusTransitionError from '../errors/invalid-seller-status-transition.error';
import SalesType from './enums/sales-type.enum';
import SellerDocumentType from './enums/seller-document-type.enum';
import SellerGender from './enums/seller-gender.enum';
import SellerKind from './enums/seller-kind.enum';
import SellerStatus from './enums/seller-status.enum';

export type SellerProps = {
  id: number | null;
  userId: number;
  kind: SellerKind;
  shopName: string | null;
  workplacePhone: string | null;
  province: string | null;
  city: string | null;
  postalCode: string | null;
  salesType: SalesType | null;
  address: string | null;
  industryType: string;
  category: string;
  activityType: string;
  documentType: SellerDocumentType;
  documentKey: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: SellerGender | null;
  avatarKey: string | null;
  status: SellerStatus;
};

const ALLOWED_TRANSITIONS: Record<SellerStatus, SellerStatus[]> = {
  [SellerStatus.PENDING]: [SellerStatus.ACTIVE, SellerStatus.INACTIVE],
  [SellerStatus.ACTIVE]: [SellerStatus.SUSPENDED, SellerStatus.INACTIVE],
  [SellerStatus.SUSPENDED]: [SellerStatus.ACTIVE, SellerStatus.INACTIVE],
  [SellerStatus.INACTIVE]: [SellerStatus.ACTIVE],
};

export default class Seller {
  private constructor(private props: SellerProps) {}

  static create(input: Omit<SellerProps, 'id' | 'status'>): Seller {
    return new Seller({
      ...input,
      id: null,
      shopName: input.shopName?.trim() || null,
      province: input.province?.trim() || null,
      city: input.city?.trim() || null,
      address: input.address?.trim() || null,
      workplacePhone: input.workplacePhone?.trim() || null,
      postalCode: input.postalCode?.trim() || null,
      industryType: input.industryType.trim(),
      category: input.category.trim(),
      activityType: input.activityType.trim(),
      nationalId: input.nationalId?.trim() || null,
      dateOfBirth: input.dateOfBirth?.trim() || null,
      gender: input.gender ?? null,
      avatarKey: input.avatarKey?.trim() || null,
      status: SellerStatus.PENDING,
    });
  }

  static restore(props: SellerProps): Seller {
    return new Seller({ ...props });
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Seller has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getKind(): SellerKind {
    return this.props.kind;
  }

  getShopName(): string | null {
    return this.props.shopName;
  }

  getWorkplacePhone(): string | null {
    return this.props.workplacePhone;
  }

  getProvince(): string | null {
    return this.props.province;
  }

  getCity(): string | null {
    return this.props.city;
  }

  getPostalCode(): string | null {
    return this.props.postalCode;
  }

  getSalesType(): SalesType | null {
    return this.props.salesType;
  }

  getAddress(): string | null {
    return this.props.address;
  }

  getIndustryType(): string {
    return this.props.industryType;
  }

  getCategory(): string {
    return this.props.category;
  }

  getActivityType(): string {
    return this.props.activityType;
  }

  getDocumentType(): SellerDocumentType {
    return this.props.documentType;
  }

  getDocumentKey(): string {
    return this.props.documentKey;
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

  getStatus(): SellerStatus {
    return this.props.status;
  }

  isActive(): boolean {
    return this.props.status === SellerStatus.ACTIVE;
  }

  isProfileComplete(): boolean {
    return Boolean(
      this.props.shopName &&
      this.props.province &&
      this.props.city &&
      this.props.address &&
      this.props.salesType,
    );
  }

  completeProfile(input: {
    shopName: string;
    workplacePhone: string | null;
    province: string;
    city: string;
    postalCode: string | null;
    salesType: SalesType;
    address: string;
  }): void {
    this.props.shopName = input.shopName.trim();
    this.props.workplacePhone = input.workplacePhone?.trim() || null;
    this.props.province = input.province.trim();
    this.props.city = input.city.trim();
    this.props.postalCode = input.postalCode?.trim() || null;
    this.props.salesType = input.salesType;
    this.props.address = input.address.trim();
  }

  patchProfile(input: {
    shopName?: string;
    workplacePhone?: string | null;
    province?: string;
    city?: string;
    postalCode?: string | null;
    salesType?: SalesType | null;
    address?: string;
    industryType?: string;
    category?: string;
    activityType?: string;
    documentType?: SellerDocumentType;
    documentKey?: string;
    nationalId?: string | null;
    dateOfBirth?: string | null;
    gender?: SellerGender | null;
    avatarKey?: string | null;
  }): void {
    if (input.shopName !== undefined) {
      this.props.shopName = input.shopName.trim() || null;
    }
    if (input.workplacePhone !== undefined) {
      this.props.workplacePhone = input.workplacePhone?.trim() || null;
    }
    if (input.province !== undefined) {
      this.props.province = input.province.trim() || null;
    }
    if (input.city !== undefined) {
      this.props.city = input.city.trim() || null;
    }
    if (input.postalCode !== undefined) {
      this.props.postalCode = input.postalCode?.trim() || null;
    }
    if (input.salesType !== undefined) {
      this.props.salesType = input.salesType;
    }
    if (input.address !== undefined) {
      this.props.address = input.address.trim() || null;
    }
    if (input.industryType !== undefined) {
      this.props.industryType = input.industryType.trim();
    }
    if (input.category !== undefined) {
      this.props.category = input.category.trim();
    }
    if (input.activityType !== undefined) {
      this.props.activityType = input.activityType.trim();
    }
    if (input.documentType !== undefined) {
      this.props.documentType = input.documentType;
    }
    if (input.documentKey !== undefined) {
      this.props.documentKey = input.documentKey.trim();
    }
    if (input.nationalId !== undefined) {
      this.props.nationalId = input.nationalId?.trim() || null;
    }
    if (input.dateOfBirth !== undefined) {
      this.props.dateOfBirth = input.dateOfBirth?.trim() || null;
    }
    if (input.gender !== undefined) {
      this.props.gender = input.gender;
    }
    if (input.avatarKey !== undefined) {
      this.props.avatarKey = input.avatarKey?.trim() || null;
    }
  }

  transitionTo(next: SellerStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this.props.status];
    if (!allowed.includes(next)) {
      throw new InvalidSellerStatusTransitionError();
    }
    this.props.status = next;
  }
}
