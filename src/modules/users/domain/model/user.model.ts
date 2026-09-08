import ForbiddenError from '../errors/forbidden.error';
import AccountStatus from './enums/account-status.enum';
import Role from './enums/role.enum';

export type UserProps = {
  id: number | null;
  phone: string;
  firstName: string;
  lastName: string;
  status: AccountStatus;
  phoneVerifiedAt: Date | null;
  roles: Role[];
  activityType: string | null;
  guildType: string | null;
};

export default class User {
  private constructor(private props: UserProps) {}

  static createFromSignup(input: {
    phone: string;
    firstName: string;
    lastName: string;
    roles: Role[];
    activityType: string | null;
    guildType: string | null;
  }): User {
    return new User({
      id: null,
      phone: input.phone,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      status: AccountStatus.ACTIVE,
      phoneVerifiedAt: new Date(),
      roles: [...input.roles],
      activityType: input.activityType?.trim() || null,
      guildType: input.guildType?.trim() || null,
    });
  }

  static createBuyer(phone: string, firstName: string, lastName = ''): User {
    return User.createFromSignup({
      phone,
      firstName,
      lastName,
      roles: [Role.RETAIL_BUYER],
      activityType: null,
      guildType: null,
    });
  }

  static createForSeller(
    phone: string,
    firstName: string,
    lastName: string,
    sellerRole: Role.RETAIL_SELLER | Role.WHOLESALE_SELLER,
  ): User {
    return User.createFromSignup({
      phone,
      firstName,
      lastName,
      roles: [Role.RETAIL_BUYER, sellerRole],
      activityType: null,
      guildType: null,
    });
  }

  static createAdmin(phone: string, firstName: string, lastName = ''): User {
    return new User({
      id: null,
      phone,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      status: AccountStatus.ACTIVE,
      phoneVerifiedAt: new Date(),
      roles: [Role.ADMIN],
      activityType: null,
      guildType: null,
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

  getFirstName(): string {
    return this.props.firstName;
  }

  getLastName(): string {
    return this.props.lastName;
  }

  getFullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
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

  getActivityType(): string | null {
    return this.props.activityType;
  }

  getGuildType(): string | null {
    return this.props.guildType;
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

  rename(firstName: string, lastName: string): void {
    const first = firstName.trim();
    const last = lastName.trim();
    if (first) {
      this.props.firstName = first;
    }
    if (last) {
      this.props.lastName = last;
    }
  }

  addSellerRole(role: Role.RETAIL_SELLER | Role.WHOLESALE_SELLER): void {
    if (this.hasRole(Role.ADMIN)) {
      throw new ForbiddenError();
    }
    if (this.hasRole(role)) {
      return;
    }
    if (
      !this.hasRole(Role.RETAIL_BUYER) &&
      !this.hasRole(Role.WHOLESALE_BUYER)
    ) {
      this.props.roles.push(Role.RETAIL_BUYER);
    }
    this.props.roles.push(role);
  }
}
