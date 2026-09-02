import Seller from '../../../domain/model/seller.model';
import SellerEntity from '../entities/seller.entity';

export default class SellerMapper {
  static toDomain(entity: SellerEntity): Seller {
    return Seller.restore({
      id: entity.id,
      userId: entity.user_id,
      kind: entity.kind,
      shopName: entity.shop_name,
      workplacePhone: entity.workplace_phone,
      province: entity.province,
      city: entity.city,
      postalCode: entity.postal_code,
      salesType: entity.sales_type,
      address: entity.address,
      documentType: entity.document_type,
      documentKey: entity.document_key,
      status: entity.status,
    });
  }

  static toEntity(model: Seller): SellerEntity {
    const entity = new SellerEntity();
    if (model.hasId()) {
      entity.id = model.getId();
    }
    entity.user_id = model.getUserId();
    entity.kind = model.getKind();
    entity.shop_name = model.getShopName();
    entity.workplace_phone = model.getWorkplacePhone();
    entity.province = model.getProvince();
    entity.city = model.getCity();
    entity.postal_code = model.getPostalCode();
    entity.sales_type = model.getSalesType();
    entity.address = model.getAddress();
    entity.document_type = model.getDocumentType();
    entity.document_key = model.getDocumentKey();
    entity.status = model.getStatus();
    return entity;
  }
}
