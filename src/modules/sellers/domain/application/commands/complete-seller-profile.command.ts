import SalesType from '../../model/enums/sales-type.enum';

export default class CompleteSellerProfileCommand {
  constructor(
    readonly userId: number,
    readonly shopName: string,
    readonly workplacePhone: string | null,
    readonly province: string,
    readonly city: string,
    readonly postalCode: string | null,
    readonly salesType: SalesType,
    readonly address: string,
  ) {}
}
