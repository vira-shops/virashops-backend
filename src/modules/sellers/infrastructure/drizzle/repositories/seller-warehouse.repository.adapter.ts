import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import SellerWarehouse from '../../../domain/model/seller-warehouse.model';
import type SellerWarehouseRepositoryPort from '../../../domain/ports/seller-warehouse.repository.port';
import { sellerWarehouses } from '../schema/sellers';

@Injectable()
export default class DrizzleSellerWarehouseRepositoryAdapter implements SellerWarehouseRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listBySellerId(sellerId: number): Promise<SellerWarehouse[]> {
    const rows = await this.db
      .select()
      .from(sellerWarehouses)
      .where(
        and(
          eq(sellerWarehouses.sellerId, sellerId),
          isNull(sellerWarehouses.deletedAt),
        ),
      )
      .orderBy(asc(sellerWarehouses.sortOrder), asc(sellerWarehouses.id));
    return rows.map((row) =>
      SellerWarehouse.restore({
        id: row.id,
        sellerId: row.sellerId,
        phone: row.phone,
        postalCode: row.postalCode,
        city: row.city,
        address: row.address,
        sortOrder: row.sortOrder,
      }),
    );
  }

  async findByIdForSeller(
    id: number,
    sellerId: number,
  ): Promise<SellerWarehouse | null> {
    const row = await this.db.query.sellerWarehouses.findFirst({
      where: and(
        eq(sellerWarehouses.id, id),
        eq(sellerWarehouses.sellerId, sellerId),
        isNull(sellerWarehouses.deletedAt),
      ),
    });
    if (!row) {
      return null;
    }
    return SellerWarehouse.restore({
      id: row.id,
      sellerId: row.sellerId,
      phone: row.phone,
      postalCode: row.postalCode,
      city: row.city,
      address: row.address,
      sortOrder: row.sortOrder,
    });
  }

  async save(warehouse: SellerWarehouse): Promise<SellerWarehouse> {
    const snap = warehouse.toSnapshot();
    if (snap.id === null) {
      const [row] = await this.db
        .insert(sellerWarehouses)
        .values({
          sellerId: snap.sellerId,
          phone: snap.phone,
          postalCode: snap.postalCode,
          city: snap.city,
          address: snap.address,
          sortOrder: snap.sortOrder,
        })
        .returning();
      return SellerWarehouse.restore({
        id: row.id,
        sellerId: row.sellerId,
        phone: row.phone,
        postalCode: row.postalCode,
        city: row.city,
        address: row.address,
        sortOrder: row.sortOrder,
      });
    }
    const [row] = await this.db
      .update(sellerWarehouses)
      .set({
        phone: snap.phone,
        postalCode: snap.postalCode,
        city: snap.city,
        address: snap.address,
        sortOrder: snap.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(sellerWarehouses.id, snap.id))
      .returning();
    return SellerWarehouse.restore({
      id: row.id,
      sellerId: row.sellerId,
      phone: row.phone,
      postalCode: row.postalCode,
      city: row.city,
      address: row.address,
      sortOrder: row.sortOrder,
    });
  }

  async softDelete(id: number, sellerId: number): Promise<void> {
    await this.db
      .update(sellerWarehouses)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(sellerWarehouses.id, id),
          eq(sellerWarehouses.sellerId, sellerId),
          isNull(sellerWarehouses.deletedAt),
        ),
      );
  }
}
