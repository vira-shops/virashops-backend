import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Address from '../../../domain/model/address.model';
import type AddressRepositoryPort from '../../../domain/ports/address.repository.port';
import AddressMapper from '../mappers/address.mapper';
import { addresses } from '../schema/addresses';

@Injectable()
export default class DrizzleAddressRepositoryAdapter implements AddressRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByIdForUser(id: number, userId: number): Promise<Address | null> {
    const row = await this.db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, id),
        eq(addresses.userId, userId),
        isNull(addresses.deletedAt),
      ),
    });
    return row ? AddressMapper.toDomain(row) : null;
  }

  async listByUserId(userId: number): Promise<Address[]> {
    const rows = await this.db
      .select()
      .from(addresses)
      .where(and(eq(addresses.userId, userId), isNull(addresses.deletedAt)))
      .orderBy(asc(addresses.id));
    return rows.map((row) => AddressMapper.toDomain(row));
  }

  async save(address: Address): Promise<Address> {
    const snap = address.toSnapshot();
    if (snap.id === null) {
      const [row] = await this.db
        .insert(addresses)
        .values({
          userId: snap.userId,
          label: snap.label,
          line1: snap.line1,
          line2: snap.line2,
          city: snap.city,
          province: snap.province,
          postalCode: snap.postalCode,
          recipientFullName: snap.recipientFullName,
          recipientPhone: snap.recipientPhone,
          nationalId: snap.nationalId,
          houseNumber: snap.houseNumber,
          isDefault: snap.isDefault,
        })
        .returning();
      return AddressMapper.toDomain(row);
    }
    const [row] = await this.db
      .update(addresses)
      .set({
        label: snap.label,
        line1: snap.line1,
        line2: snap.line2,
        city: snap.city,
        province: snap.province,
        postalCode: snap.postalCode,
        recipientFullName: snap.recipientFullName,
        recipientPhone: snap.recipientPhone,
        nationalId: snap.nationalId,
        houseNumber: snap.houseNumber,
        isDefault: snap.isDefault,
      })
      .where(and(eq(addresses.id, snap.id), eq(addresses.userId, snap.userId)))
      .returning();
    return AddressMapper.toDomain(row);
  }

  async deleteByIdForUser(id: number, userId: number): Promise<void> {
    await this.db
      .update(addresses)
      .set({ deletedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  }

  async clearDefaultForUser(userId: number): Promise<void> {
    await this.db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, userId), isNull(addresses.deletedAt)));
  }
}
