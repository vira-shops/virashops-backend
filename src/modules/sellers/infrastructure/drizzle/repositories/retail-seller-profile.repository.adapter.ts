import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import RetailSellerProfile from '../../../domain/model/retail-seller-profile.model';
import SellerGender from '../../../domain/model/enums/seller-gender.enum';
import type RetailSellerProfileRepositoryPort from '../../../domain/ports/retail-seller-profile.repository.port';
import { retailSellerProfiles } from '../schema/retail-seller-profiles';

function toNumber(value: string | null): number | null {
  if (value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumeric(value: number | null): string | null {
  return value === null ? null : value.toFixed(7);
}

@Injectable()
export default class DrizzleRetailSellerProfileRepositoryAdapter implements RetailSellerProfileRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByUserId(userId: number): Promise<RetailSellerProfile | null> {
    const row = await this.db.query.retailSellerProfiles.findFirst({
      where: and(
        eq(retailSellerProfiles.userId, userId),
        isNull(retailSellerProfiles.deletedAt),
      ),
    });
    if (!row) {
      return null;
    }
    return RetailSellerProfile.restore({
      id: row.id,
      userId: row.userId,
      email: row.email,
      occupation: row.occupation,
      nationalId: row.nationalId,
      dateOfBirth: row.dateOfBirth,
      gender: (row.gender as SellerGender | null) ?? null,
      avatarKey: row.avatarKey,
      province: row.province,
      city: row.city,
      address: row.address,
      postalCode: row.postalCode,
      latitude: toNumber(row.latitude),
      longitude: toNumber(row.longitude),
    });
  }

  async save(profile: RetailSellerProfile): Promise<RetailSellerProfile> {
    const snap = profile.toSnapshot();
    const values = {
      userId: snap.userId,
      email: snap.email,
      occupation: snap.occupation,
      nationalId: snap.nationalId,
      dateOfBirth: snap.dateOfBirth,
      gender: snap.gender,
      avatarKey: snap.avatarKey,
      province: snap.province,
      city: snap.city,
      address: snap.address,
      postalCode: snap.postalCode,
      latitude: toNumeric(snap.latitude),
      longitude: toNumeric(snap.longitude),
    };
    if (snap.id === null) {
      const [row] = await this.db
        .insert(retailSellerProfiles)
        .values(values)
        .returning();
      return RetailSellerProfile.restore({
        ...snap,
        id: row.id,
        latitude: toNumber(row.latitude),
        longitude: toNumber(row.longitude),
      });
    }
    const [row] = await this.db
      .update(retailSellerProfiles)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(retailSellerProfiles.id, snap.id))
      .returning();
    return RetailSellerProfile.restore({
      ...snap,
      id: row.id,
      latitude: toNumber(row.latitude),
      longitude: toNumber(row.longitude),
    });
  }
}
