import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Cart from '../../../domain/model/cart.model';
import type CartRepositoryPort from '../../../domain/ports/cart.repository.port';
import CartMapper from '../mappers/cart.mapper';
import { cartItems, carts } from '../schema/carts';

@Injectable()
export default class DrizzleCartRepositoryAdapter implements CartRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findActiveByUserId(userId: number): Promise<Cart | null> {
    const cart = await this.db.query.carts.findFirst({
      where: and(eq(carts.userId, userId), isNull(carts.deletedAt)),
    });
    if (!cart) {
      return null;
    }
    const items = await this.db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), isNull(cartItems.deletedAt)));
    return CartMapper.toDomain(cart, items);
  }

  async save(cart: Cart): Promise<Cart> {
    const snap = cart.toSnapshot();
    return this.db.transaction(async (tx) => {
      let cartId = snap.id;
      if (cartId === null) {
        const [created] = await tx
          .insert(carts)
          .values({
            userId: snap.userId,
            channel: snap.channel,
          })
          .returning();
        cartId = created.id;
      } else {
        await tx
          .update(carts)
          .set({ channel: snap.channel })
          .where(eq(carts.id, cartId));
      }

      // Include soft-deleted rows so we can revive (cart_id, product_id) unique.
      const existingRows = await tx
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cartId));
      const activeRows = existingRows.filter((row) => row.deletedAt === null);
      const activeByProduct = new Map(
        activeRows.map((row) => [row.productId, row]),
      );
      const anyByProduct = new Map(
        existingRows.map((row) => [row.productId, row]),
      );
      const keepProductIds = new Set(
        snap.items.map((item) => item.getProductId()),
      );

      for (const row of activeRows) {
        if (!keepProductIds.has(row.productId)) {
          await tx
            .update(cartItems)
            .set({ deletedAt: new Date() })
            .where(eq(cartItems.id, row.id));
        }
      }

      for (const item of snap.items) {
        const data = {
          cartId,
          productId: item.getProductId(),
          sellerId: item.getSellerId(),
          sellerShopName: item.getSellerShopName(),
          sellerLogoKey: item.getSellerLogoKey(),
          productNameFa: item.getProductNameFa(),
          productNameEn: item.getProductNameEn(),
          imageKey: item.getImageKey(),
          packQty: item.getPackQty(),
          pieceQty: item.getPieceQty(),
          packMultiple: item.getPackMultiple(),
          unitPrice: item.getUnitPrice(),
          packPrice: item.getPackPrice(),
          commissionPercent: item.getCommissionPercent(),
          prepaymentAmount: item.getPrepaymentAmount(),
          deletedAt: null,
        };
        const prevActive = activeByProduct.get(item.getProductId());
        const prevAny = anyByProduct.get(item.getProductId());
        if (prevActive) {
          await tx
            .update(cartItems)
            .set(data)
            .where(eq(cartItems.id, prevActive.id));
        } else if (prevAny) {
          await tx
            .update(cartItems)
            .set(data)
            .where(eq(cartItems.id, prevAny.id));
        } else {
          await tx.insert(cartItems).values(data);
        }
      }

      const [savedCart] = await tx
        .select()
        .from(carts)
        .where(eq(carts.id, cartId));
      const savedItems = await tx
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.cartId, cartId), isNull(cartItems.deletedAt)));
      return CartMapper.toDomain(savedCart, savedItems);
    });
  }

  async deleteItem(cartId: number, itemId: number): Promise<void> {
    await this.db
      .update(cartItems)
      .set({ deletedAt: new Date() })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.id, itemId)));
  }
}
