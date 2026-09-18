import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Order from '../../../domain/model/order.model';
import type OrderRepositoryPort from '../../../domain/ports/order.repository.port';
import OrderMapper from '../mappers/order.mapper';
import { orderItems, orders } from '../schema/orders';

@Injectable()
export default class DrizzleOrderRepositoryAdapter implements OrderRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByIdForUser(id: number, userId: number): Promise<Order | null> {
    const order = await this.db.query.orders.findFirst({
      where: and(
        eq(orders.id, id),
        eq(orders.userId, userId),
        isNull(orders.deletedAt),
      ),
    });
    if (!order) {
      return null;
    }
    const items = await this.db
      .select()
      .from(orderItems)
      .where(
        and(eq(orderItems.orderId, order.id), isNull(orderItems.deletedAt)),
      );
    return OrderMapper.toDomain(order, items);
  }

  async listByUserId(userId: number): Promise<Order[]> {
    const rows = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), isNull(orders.deletedAt)))
      .orderBy(desc(orders.id));
    const result: Order[] = [];
    for (const order of rows) {
      const items = await this.db
        .select()
        .from(orderItems)
        .where(
          and(eq(orderItems.orderId, order.id), isNull(orderItems.deletedAt)),
        );
      result.push(OrderMapper.toDomain(order, items));
    }
    return result;
  }

  async findByCheckoutSessionId(
    checkoutSessionId: number,
  ): Promise<Order | null> {
    const order = await this.db.query.orders.findFirst({
      where: and(
        eq(orders.checkoutSessionId, checkoutSessionId),
        isNull(orders.deletedAt),
      ),
    });
    if (!order) {
      return null;
    }
    const items = await this.db
      .select()
      .from(orderItems)
      .where(
        and(eq(orderItems.orderId, order.id), isNull(orderItems.deletedAt)),
      );
    return OrderMapper.toDomain(order, items);
  }

  async save(order: Order): Promise<Order> {
    const snap = order.toSnapshot();
    return this.db.transaction(async (tx) => {
      let orderId = snap.id;
      if (orderId === null) {
        const [created] = await tx
          .insert(orders)
          .values({
            orderNumber: snap.orderNumber,
            userId: snap.userId,
            sellerId: snap.sellerId,
            sellerShopName: snap.sellerShopName,
            checkoutSessionId: snap.checkoutSessionId,
            status: snap.status,
            paymentStatus: snap.paymentStatus,
            address: snap.address,
            shippingMethod: snap.shippingMethod,
            shippingFee: snap.shippingFee,
            deliveryDate: snap.deliveryDate,
            windowStartHour: snap.windowStartHour,
            windowEndHour: snap.windowEndHour,
            note: snap.note,
            goodsTotal: snap.goodsTotal,
            commissionTotal: snap.commissionTotal,
            prepaymentTotal: snap.prepaymentTotal,
            grandTotal: snap.grandTotal,
          })
          .returning();
        orderId = created.id;
        for (const item of snap.items) {
          await tx.insert(orderItems).values({
            orderId,
            productId: item.productId,
            productNameFa: item.productNameFa,
            productNameEn: item.productNameEn,
            imageKey: item.imageKey,
            packQty: item.packQty,
            pieceQty: item.pieceQty,
            packMultiple: item.packMultiple,
            unitPrice: item.unitPrice,
            packPrice: item.packPrice,
            commissionPercent: item.commissionPercent,
            commissionAmount: item.commissionAmount,
            prepaymentAmount: item.prepaymentAmount,
            goodsAmount: item.goodsAmount,
            lineTotal: item.lineTotal,
            totalUnits: item.totalUnits,
          });
        }
      }
      const [saved] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
      return OrderMapper.toDomain(saved, items);
    });
  }

  async nextOrderNumber(): Promise<string> {
    const { randomBytes } = await import('crypto');
    return `VR-${Date.now()}-${randomBytes(3).toString('hex')}`;
  }
}
