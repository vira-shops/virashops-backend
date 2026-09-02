import ForbiddenError from '../errors/forbidden.error';
import SellerAlreadyExistsError from '../errors/seller-already-exists.error';
import AccountStatus from './enums/account-status.enum';
import Role from './enums/role.enum';

type UserProps = {
  id: number | null;
  phone: string;
  fullName: string;
  status: AccountStatus;
  phoneVerifiedAt: Date | null;
  roles: Role[];
};

export default class User {
  private constructor(private props: UserProps) {}

  static createBuyer(phone: string, fullName: string): User {
    return new User({
      id: null,
      phone,
      fullName: fullName.trim(),
      status: AccountStatus.ACTIVE,
      phoneVerifiedAt: new Date(),
      roles: [Role.USER],
    });
  }

  static createForSeller(
    phone: string,
    fullName: string,
    sellerRole: Role.RETAIL_SELLER | Role.WHOLESALE_SELLER,
  ): User {
    return new User({
      id: null,
      phone,
      fullName: fullName.trim(),
      status: AccountStatus.ACTIVE,
      phoneVerifiedAt: null,
      roles: [Role.USER, sellerRole],
    });
  }

  static createAdmin(phone: string, fullName: string): User {
    return new User({
      id: null,
      phone,
      fullName: fullName.trim(),
      status: AccountStatus.ACTIVE,
      phoneVerifiedAt: new Date(),
      roles: [Role.ADMIN],
    });
  }

  static restore(props: UserProps): User {
    return new User({ ...props, roles: [...props.roles] });
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('User has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getPhone(): string {
    return this.props.phone;
  }

  getFullName(): string {
    return this.props.fullName;
  }

  getStatus(): AccountStatus {
    return this.props.status;
  }

  getPhoneVerifiedAt(): Date | null {
    return this.props.phoneVerifiedAt;
  }

  isPhoneVerified(): boolean {
    return this.props.phoneVerifiedAt !== null;
  }

  getRoles(): Role[] {
    return [...this.props.roles];
  }

  hasRole(role: Role | string): boolean {
    return this.props.roles.includes(role as Role);
  }

  isSeller(): boolean {
    return (
      this.hasRole(Role.RETAIL_SELLER) || this.hasRole(Role.WHOLESALE_SELLER)
    );
  }

  isActive(): boolean {
    return this.props.status === AccountStatus.ACTIVE;
  }

  assignPersistedId(id: number): void {
    this.props.id = id;
  }

  markPhoneVerified(): void {
    if (!this.props.phoneVerifiedAt) {
      this.props.phoneVerifiedAt = new Date();
    }
  }

  rename(fullName: string): void {
    const trimmed = fullName.trim();
    if (trimmed) {
      this.props.fullName = trimmed;
    }
  }

  addSellerRole(role: Role.RETAIL_SELLER | Role.WHOLESALE_SELLER): void {
    if (this.hasRole(Role.ADMIN)) {
      throw new ForbiddenError();
    }
    if (this.isSeller()) {
      throw new SellerAlreadyExistsError();
    }
    if (!this.hasRole(Role.USER)) {
      this.props.roles.push(Role.USER);
    }
    this.props.roles.push(role);
  }
}
