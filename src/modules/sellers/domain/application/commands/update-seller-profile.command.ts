import SalesType from '../../model/enums/sales-type.enum';
import SellerDocumentType from '../../model/enums/seller-document-type.enum';
import SellerGender from '../../model/enums/seller-gender.enum';

export default class UpdateSellerProfileCommand {
  constructor(
    readonly userId: number,
    readonly firstName?: string,
    readonly lastName?: string,
    readonly nationalId?: string | null,
    readonly dateOfBirth?: string | null,
    readonly gender?: SellerGender | null,
    readonly avatarKey?: string | null,
    readonly shopName?: string,
    readonly workplacePhone?: string | null,
    readonly province?: string,
    readonly city?: string,
    readonly postalCode?: string | null,
    readonly salesType?: SalesType | null,
    readonly address?: string,
    readonly industryType?: string,
    readonly category?: string,
    readonly activityType?: string,
    readonly documentType?: SellerDocumentType,
    readonly documentKey?: string,
  ) {}
}
