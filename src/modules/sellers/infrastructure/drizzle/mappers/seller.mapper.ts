import SalesType from '../../../domain/model/enums/sales-type.enum';
import SellerDocumentType from '../../../domain/model/enums/seller-document-type.enum';
import SellerGender from '../../../domain/model/enums/seller-gender.enum';
import SellerKind from '../../../domain/model/enums/seller-kind.enum';
import SellerStatus from '../../../domain/model/enums/seller-status.enum';
import Seller from '../../../domain/model/seller.model';
import type { SellerRow } from '../schema/sellers';

export default class SellerMapper {
  static toDomain(row: SellerRow): Seller {
    return Seller.restore({
      id: row.id,
      userId: row.userId,
      kind: row.kind as SellerKind,
      shopName: row.shopName,
      workplacePhone: row.workplacePhone,
      province: row.province,
      city: row.city,
      postalCode: row.postalCode,
      salesType: (row.salesType as SalesType | null) ?? null,
      address: row.address,
      industryType: row.industryType,
      category: row.category,
      activityType: row.activityType,
      documentType: row.documentType as SellerDocumentType,
      documentKey: row.documentKey,
      nationalId: row.nationalId,
      dateOfBirth: row.dateOfBirth,
      gender: (row.gender as SellerGender | null) ?? null,
      avatarKey: row.avatarKey,
      status: row.status as SellerStatus,
    });
  }
}
