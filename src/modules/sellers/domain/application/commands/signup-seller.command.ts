import SalesType from '../../model/enums/sales-type.enum';
import SellerDocumentType from '../../model/enums/seller-document-type.enum';
import SellerKind from '../../model/enums/seller-kind.enum';

export type SellerDocumentPayload = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
};

export default class SignupSellerCommand {
  constructor(
    readonly kind: SellerKind,
    readonly fullName: string,
    readonly phone: string,
    readonly shopName: string,
    readonly workplacePhone: string | null,
    readonly province: string,
    readonly city: string,
    readonly postalCode: string | null,
    readonly salesType: SalesType,
    readonly address: string,
    readonly documentType: SellerDocumentType,
    readonly document: SellerDocumentPayload | null,
  ) {}
}
