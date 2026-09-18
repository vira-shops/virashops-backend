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
    return {
      ...props,
      label,
      line1,
      line2: props.line2?.trim() || null,
      city,
      province,
      postalCode: props.postalCode?.trim() || null,
    };
  }
}
