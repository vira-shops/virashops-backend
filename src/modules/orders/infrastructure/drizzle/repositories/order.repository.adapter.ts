import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  SQL,
} from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Order from '../../../domain/model/order.model';
import OrderStatus from '../../../domain/model/enums/order-status.enum';
import type OrderRepositoryPort from '../../../domain/ports/order.repository.port';
import type {
  ListOrdersFilter,
  ListSellerOrdersFilter,
  OrderPage,
  OrderStatusCounts,
  SellerOrderStatusCounts,
} from '../../../domain/ports/order.repository.port';
import OrderMapper from '../mappers/order.mapper';
import { orderItems, orders } from '../schema/orders';

const PROCESSING_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPED,
];
const CANCELLED_STATUSES = [OrderStatus.CANCELLED, OrderStatus.FAILED];

@Injectable()
export default class DrizzleOrderRepositoryAdapter implements OrderRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByIdForUser(id: number, userId: number): Promise<Order | null> {
    return this.findByIdScoped(id, eq(orders.userId, userId));
  }

  async findByIdForSeller(id: number, sellerId: number): Promise<Order | null> {
    return this.findByIdScoped(id, eq(orders.sellerId, sellerId));
  }

  async listByUserId(filter: ListOrdersFilter): Promise<OrderPage> {
    return this.listScoped({
      owner: eq(orders.userId, filter.userId),
      fromDate: filter.fromDate,
      toDate: filter.toDate,
      status: filter.status,
      page: filter.page,
      limit: filter.limit,
    });
  }

  async listBySellerId(filter: ListSellerOrdersFilter): Promise<OrderPage> {
    return this.listScoped({
      owner: eq(orders.sellerId, filter.sellerId),
      fromDate: filter.fromDate,
      toDate: filter.toDate,
      status: filter.status,
      page: filter.page,
      limit: filter.limit,
    });
  }

  async countByStatusGroups(userId: number): Promise<OrderStatusCounts> {
    const base = and(eq(orders.userId, userId), isNull(orders.deletedAt));
    const [delivered] = await this.db
      .select({ value: count() })
      .from(orders)
      .where(and(base, eq(orders.status, OrderStatus.DELIVERED)));
    const [processing] = await this.db
      .select({ value: count() })
      .from(orders)
      .where(and(base, inArray(orders.status, PROCESSING_STATUSES)));
    const [cancelled] = await this.db
      .select({ value: count() })
      .from(orders)
      .where(and(base, inArray(orders.status, CANCELLED_STATUSES)));
    return {
      delivered: Number(delivered?.value ?? 0),
      processing: Number(processing?.value ?? 0),
      cancelled: Number(cancelled?.value ?? 0),
    };
  }

  async countByStatusForSeller(
    sellerId: number,
  ): Promise<SellerOrderStatusCounts> {
    const base = and(eq(orders.sellerId, sellerId), isNull(orders.deletedAt));
    const countStatus = async (status: OrderStatus) => {
      const [row] = await this.db
        .select({ value: count() })
        .from(orders)
        .where(and(base, eq(orders.status, status)));
      return Number(row?.value ?? 0);
    };
    return {
      paid: await countStatus(OrderStatus.PAID),
      processing: await countStatus(OrderStatus.PROCESSING),
      preparing: await countStatus(OrderStatus.PREPARING),
      shipped: await countStatus(OrderStatus.SHIPPED),
      delivered: await countStatus(OrderStatus.DELIVERED),
      returned: await countStatus(OrderStatus.RETURNED),
      cancelled: await countStatus(OrderStatus.CANCELLED),
      failed: await countStatus(OrderStatus.FAILED),
    };
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
            paymentMethod: snap.paymentMethod,
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
            priceTotal: snap.priceTotal,
            discountTotal: snap.discountTotal,
            priceAfterDiscount: snap.priceAfterDiscount,
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
      } else {
        await tx
          .update(orders)
          .set({
            status: snap.status,
            paymentStatus: snap.paymentStatus,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
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

  private async findByIdScoped(id: number, owner: SQL): Promise<Order | null> {
    const order = await this.db.query.orders.findFirst({
      where: and(eq(orders.id, id), owner, isNull(orders.deletedAt)),
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

  private async listScoped(filter: {
    owner: SQL;
    fromDate?: string | null;
    toDate?: string | null;
    status?: OrderStatus | null;
    page: number;
    limit: number;
  }): Promise<OrderPage> {
    const conditions = [filter.owner, isNull(orders.deletedAt)];
    if (filter.status) {
      conditions.push(eq(orders.status, filter.status));
    }
    if (filter.fromDate) {
      conditions.push(
        gte(orders.createdAt, new Date(`${filter.fromDate}T00:00:00.000Z`)),
      );
    }
    if (filter.toDate) {
      conditions.push(
        lte(orders.createdAt, new Date(`${filter.toDate}T23:59:59.999Z`)),
      );
    }
    const where = and(...conditions);
    const [totalRow] = await this.db
      .select({ value: count() })
      .from(orders)
      .where(where);
    const rows = await this.db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.id))
      .limit(filter.limit)
      .offset((filter.page - 1) * filter.limit);
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
    return {
      items: result,
      total: Number(totalRow?.value ?? 0),
    };
  }
}
