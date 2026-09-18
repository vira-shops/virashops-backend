import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import CheckoutSession from '../../../domain/model/checkout-session.model';
import CheckoutSessionStatus from '../../../domain/model/enums/checkout-session-status.enum';
import type CheckoutSessionRepositoryPort from '../../../domain/ports/checkout-session.repository.port';
import CheckoutSessionMapper from '../mappers/checkout-session.mapper';
import { checkoutSessions } from '../schema/orders';

@Injectable()
export default class DrizzleCheckoutSessionRepositoryAdapter implements CheckoutSessionRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByIdForUser(
    id: number,
    userId: number,
  ): Promise<CheckoutSession | null> {
    const row = await this.db.query.checkoutSessions.findFirst({
      where: and(
        eq(checkoutSessions.id, id),
        eq(checkoutSessions.userId, userId),
        isNull(checkoutSessions.deletedAt),
      ),
    });
    return row ? CheckoutSessionMapper.toDomain(row) : null;
  }

  async findOpenByUserAndSeller(
    userId: number,
    sellerId: number,
  ): Promise<CheckoutSession | null> {
    const rows = await this.db
      .select()
      .from(checkoutSessions)
      .where(
        and(
          eq(checkoutSessions.userId, userId),
          eq(checkoutSessions.sellerId, sellerId),
          eq(checkoutSessions.status, CheckoutSessionStatus.AWAITING_PAYMENT),
          isNull(checkoutSessions.deletedAt),
        ),
      )
      .orderBy(desc(checkoutSessions.id))
      .limit(1);
    const row = rows[0];
    return row ? CheckoutSessionMapper.toDomain(row) : null;
  }

  async save(session: CheckoutSession): Promise<CheckoutSession> {
    const snap = session.toSnapshot();
    if (snap.id === null) {
      const [row] = await this.db
        .insert(checkoutSessions)
        .values({
          userId: snap.userId,
          sellerId: snap.sellerId,
          sellerShopName: snap.sellerShopName,
          sellerLogoKey: snap.sellerLogoKey,
          status: snap.status,
          address: snap.address,
          shippingMethod: snap.shippingMethod,
          shippingFee: snap.shippingFee,
          deliveryDate: snap.deliveryDate,
          windowStartHour: snap.windowStartHour,
          windowEndHour: snap.windowEndHour,
          note: snap.note,
          lines: snap.lines,
          linesHash: snap.linesHash,
          goodsTotal: snap.goodsTotal,
          commissionTotal: snap.commissionTotal,
          prepaymentTotal: snap.prepaymentTotal,
          payableAmount: snap.payableAmount,
          orderId: snap.orderId,
        })
        .returning();
      return CheckoutSessionMapper.toDomain(row);
    }
    const [row] = await this.db
      .update(checkoutSessions)
      .set({
        sellerShopName: snap.sellerShopName,
        sellerLogoKey: snap.sellerLogoKey,
        status: snap.status,
        address: snap.address,
        shippingMethod: snap.shippingMethod,
        shippingFee: snap.shippingFee,
        deliveryDate: snap.deliveryDate,
        windowStartHour: snap.windowStartHour,
        windowEndHour: snap.windowEndHour,
        note: snap.note,
        lines: snap.lines,
        linesHash: snap.linesHash,
        goodsTotal: snap.goodsTotal,
        commissionTotal: snap.commissionTotal,
        prepaymentTotal: snap.prepaymentTotal,
        payableAmount: snap.payableAmount,
        orderId: snap.orderId,
      })
      .where(eq(checkoutSessions.id, snap.id))
      .returning();
    return CheckoutSessionMapper.toDomain(row);
  }
}
