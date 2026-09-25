export type SellerWarehouseProps = {
  id: number | null;
  sellerId: number;
  phone: string | null;
  postalCode: string | null;
  city: string | null;
  address: string | null;
  sortOrder: number;
};

export default class SellerWarehouse {
  private constructor(private props: SellerWarehouseProps) {}

  static create(input: {
    sellerId: number;
    phone?: string | null;
    postalCode?: string | null;
    city?: string | null;
    address?: string | null;
    sortOrder?: number;
  }): SellerWarehouse {
    return new SellerWarehouse({
      id: null,
      sellerId: input.sellerId,
      phone: input.phone?.trim() || null,
      postalCode: input.postalCode?.trim() || null,
      city: input.city?.trim() || null,
      address: input.address?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
    });
  }

  static restore(props: SellerWarehouseProps): SellerWarehouse {
    return new SellerWarehouse({ ...props });
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Seller warehouse has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getSellerId(): number {
    return this.props.sellerId;
  }

  getPhone(): string | null {
    return this.props.phone;
  }

  getPostalCode(): string | null {
    return this.props.postalCode;
  }

  getCity(): string | null {
    return this.props.city;
  }

  getAddress(): string | null {
    return this.props.address;
  }

  getSortOrder(): number {
    return this.props.sortOrder;
  }

  patch(input: {
    phone?: string | null;
    postalCode?: string | null;
    city?: string | null;
    address?: string | null;
    sortOrder?: number;
  }): void {
    if (input.phone !== undefined) {
      this.props.phone = input.phone?.trim() || null;
    }
    if (input.postalCode !== undefined) {
      this.props.postalCode = input.postalCode?.trim() || null;
    }
    if (input.city !== undefined) {
      this.props.city = input.city?.trim() || null;
    }
    if (input.address !== undefined) {
      this.props.address = input.address?.trim() || null;
    }
    if (input.sortOrder !== undefined) {
      this.props.sortOrder = input.sortOrder;
    }
  }

  toSnapshot(): SellerWarehouseProps {
    return { ...this.props };
  }

  toView() {
    return {
      id: this.getId(),
      phone: this.props.phone,
      postalCode: this.props.postalCode,
      city: this.props.city,
      address: this.props.address,
      sortOrder: this.props.sortOrder,
    };
  }
}
