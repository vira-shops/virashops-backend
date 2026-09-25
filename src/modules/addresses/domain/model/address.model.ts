import InvalidAddressFieldError from '../errors/invalid-address-field.error';

export type AddressProps = {
  id: number | null;
  userId: number;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  recipientFullName: string;
  recipientPhone: string;
  nationalId: string;
  houseNumber: string;
  isDefault: boolean;
};

export default class Address {
  private constructor(private props: AddressProps) {}

  static create(
    input: Omit<AddressProps, 'id'> & { id?: number | null },
  ): Address {
    return new Address(
      Address.validated({
        ...input,
        id: input.id ?? null,
      }),
    );
  }

  static restore(props: AddressProps): Address {
    return new Address(Address.validated(props));
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Address has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getLabel(): string {
    return this.props.label;
  }

  getLine1(): string {
    return this.props.line1;
  }

  getLine2(): string | null {
    return this.props.line2;
  }

  getCity(): string {
    return this.props.city;
  }

  getProvince(): string {
    return this.props.province;
  }

  getPostalCode(): string | null {
    return this.props.postalCode;
  }

  getRecipientFullName(): string {
    return this.props.recipientFullName;
  }

  getRecipientPhone(): string {
    return this.props.recipientPhone;
  }

  getNationalId(): string {
    return this.props.nationalId;
  }

  getHouseNumber(): string {
    return this.props.houseNumber;
  }

  isDefault(): boolean {
    return this.props.isDefault;
  }

  update(input: {
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    recipientFullName: string;
    recipientPhone: string;
    nationalId: string;
    houseNumber: string;
    isDefault: boolean;
  }): void {
    const next = Address.validated({
      ...this.props,
      ...input,
    });
    this.props = next;
  }

  markDefault(isDefault: boolean): void {
    this.props.isDefault = isDefault;
  }

  toSnapshot(): AddressProps {
    return { ...this.props };
  }

  private static validated(props: AddressProps): AddressProps {
    const label = props.label.trim();
    const line1 = props.line1.trim();
    const city = props.city.trim();
    const province = props.province.trim();
    const recipientFullName = props.recipientFullName.trim();
    const recipientPhone = props.recipientPhone.trim();
    const nationalId = props.nationalId.trim();
    const houseNumber = props.houseNumber.trim();
    if (!label) {
      throw new InvalidAddressFieldError('Label is required');
    }
    if (!line1) {
      throw new InvalidAddressFieldError('Address line is required');
    }
    if (!city) {
      throw new InvalidAddressFieldError('City is required');
    }
    if (!province) {
      throw new InvalidAddressFieldError('Province is required');
    }
    if (!recipientFullName) {
      throw new InvalidAddressFieldError('Recipient full name is required');
    }
    if (!recipientPhone) {
      throw new InvalidAddressFieldError('Recipient phone is required');
    }
    if (!/^\d{11}$/.test(recipientPhone)) {
      throw new InvalidAddressFieldError('Recipient phone must be 11 digits');
    }
    if (!nationalId) {
      throw new InvalidAddressFieldError('National ID is required');
    }
    if (!/^\d{10}$/.test(nationalId)) {
      throw new InvalidAddressFieldError('National ID must be 10 digits');
    }
    if (!houseNumber) {
      throw new InvalidAddressFieldError('House number is required');
    }
    return {
      ...props,
      label,
      line1,
      line2: props.line2?.trim() || null,
      city,
      province,
      postalCode: props.postalCode?.trim() || null,
      recipientFullName,
      recipientPhone,
      nationalId,
      houseNumber,
    };
  }
}
