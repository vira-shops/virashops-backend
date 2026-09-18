import Cart from '../../../domain/model/cart.model';
import CartItem from '../../../domain/model/cart-item.model';
import CartChannel from '../../../domain/model/enums/cart-channel.enum';
import type { CartItemRow, CartRow } from '../schema/carts';

export default class CartMapper {
  static toDomain(cart: CartRow, items: CartItemRow[]): Cart {
    return Cart.restore({
      id: cart.id,
      userId: cart.userId,
      channel: cart.channel as CartChannel,
      items: items.map((row) =>
        CartItem.restore({
          id: row.id,
          cartId: row.cartId,
          productId: row.productId,
          sellerId: row.sellerId,
          sellerShopName: row.sellerShopName,
          sellerLogoKey: row.sellerLogoKey,
          productNameFa: row.productNameFa,
          productNameEn: row.productNameEn,
          imageKey: row.imageKey,
          packQty: row.packQty,
          pieceQty: row.pieceQty,
          packMultiple: row.packMultiple,
          unitPrice: row.unitPrice,
          packPrice: row.packPrice,
          commissionPercent: row.commissionPercent,
          prepaymentAmount: row.prepaymentAmount,
        }),
      ),
    });
  }
}
