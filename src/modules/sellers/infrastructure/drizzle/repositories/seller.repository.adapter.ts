import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Seller from '../../../domain/model/seller.model';
import SellerRepositoryPort from '../../../domain/ports/seller.repository.port';
import SellerMapper from '../mappers/seller.mapper';
import { sellers } from '../schema/sellers';

@Injectable()
export default class DrizzleSellerRepositoryAdapter implements SellerRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: number): Promise<Seller | null> {
    const row = await this.db.query.sellers.findFirst({
      where: and(eq(sellers.id, id), isNull(sellers.deletedAt)),
    });
    return row ? SellerMapper.toDomain(row) : null;
  }

  async findByUserId(userId: number): Promise<Seller | null> {
    const row = await this.db.query.sellers.findFirst({
      where: and(eq(sellers.userId, userId), isNull(sellers.deletedAt)),
    });
    return row ? SellerMapper.toDomain(row) : null;
  }

  async save(seller: Seller): Promise<Seller> {
    const values = {
      userId: seller.getUserId(),
      kind: seller.getKind(),
      shopName: seller.getShopName(),
      workplacePhone: seller.getWorkplacePhone(),
      province: seller.getProvince(),
      city: seller.getCity(),
      postalCode: seller.getPostalCode(),
      salesType: seller.getSalesType(),
      address: seller.getAddress(),
      industryType: seller.getIndustryType(),
      category: seller.getCategory(),
      activityType: seller.getActivityType(),
      documentType: seller.getDocumentType(),
      documentKey: seller.getDocumentKey(),
      status: seller.getStatus(),
    };

    if (seller.hasId()) {
      const [updated] = await this.db
        .update(sellers)
        .set(values)
        .where(eq(sellers.id, seller.getId()))
        .returning();
      if (!updated) {
        throw new Error(`Seller ${seller.getId()} was not found after save`);
      }
      return SellerMapper.toDomain(updated);
    }

    const [inserted] = await this.db.insert(sellers).values(values).returning();
    if (!inserted) {
      throw new Error('Seller insert did not return a row');
    }
    return SellerMapper.toDomain(inserted);
  }
}
