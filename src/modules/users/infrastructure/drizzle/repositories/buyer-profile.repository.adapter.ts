import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import BuyerProfile from '../../../domain/model/buyer-profile.model';
import type BuyerProfileRepositoryPort from '../../../domain/ports/buyer-profile.repository.port';
import BuyerProfileMapper from '../mappers/buyer-profile.mapper';
import { buyerProfiles } from '../schema/buyer-profiles';

@Injectable()
export default class DrizzleBuyerProfileRepositoryAdapter implements BuyerProfileRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByUserId(userId: number): Promise<BuyerProfile | null> {
    const row = await this.db.query.buyerProfiles.findFirst({
      where: and(
        eq(buyerProfiles.userId, userId),
        isNull(buyerProfiles.deletedAt),
      ),
    });
    return row ? BuyerProfileMapper.toDomain(row) : null;
  }

  async save(profile: BuyerProfile): Promise<BuyerProfile> {
    const snap = profile.toSnapshot();
    if (snap.id === null) {
      const [row] = await this.db
        .insert(buyerProfiles)
        .values({
          userId: snap.userId,
          nationalId: snap.nationalId,
          dateOfBirth: snap.dateOfBirth,
          gender: snap.gender,
          avatarKey: snap.avatarKey,
          businessName: snap.businessName,
          businessPhone: snap.businessPhone,
          postalCode: snap.postalCode,
          province: snap.province,
          city: snap.city,
          address: snap.address,
          identityType: snap.identityType,
          documentKey1: snap.documentKey1,
          documentKey2: snap.documentKey2,
        })
        .returning();
      return BuyerProfileMapper.toDomain(row);
    }
    const [row] = await this.db
      .update(buyerProfiles)
      .set({
        nationalId: snap.nationalId,
        dateOfBirth: snap.dateOfBirth,
        gender: snap.gender,
        avatarKey: snap.avatarKey,
        businessName: snap.businessName,
        businessPhone: snap.businessPhone,
        postalCode: snap.postalCode,
        province: snap.province,
        city: snap.city,
        address: snap.address,
        identityType: snap.identityType,
        documentKey1: snap.documentKey1,
        documentKey2: snap.documentKey2,
      })
      .where(eq(buyerProfiles.id, snap.id))
      .returning();
    return BuyerProfileMapper.toDomain(row);
  }
}
