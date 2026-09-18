import { Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import CartItem from '../../model/cart-item.model';
import CartViewFactory from '../services/cart-view.factory';
import CartPricingService from '../services/cart-pricing.service';
import AddCartItemCommand from '../commands/add-cart-item.command';
import GetOrCreateCartUseCase from './get-or-create-cart.usecase';
import { Inject } from '@nestjs/common';
import type CartRepositoryPort from '../../ports/cart.repository.port';
import { CART_REPOSITORY } from '../../../shared/tokens/port.token';
import type { CartView } from '../../view-models/cart-invoice.view';

@Injectable()
export default class AddCartItemUseCase {
  constructor(
    private readonly getOrCreateCart: GetOrCreateCartUseCase,
    private readonly getProductById: GetProductByIdUseCase,
    private readonly pricing: CartPricingService,
    @Inject(CART_REPOSITORY)
    private readonly carts: CartRepositoryPort,
  ) {}

  async execute(command: AddCartItemCommand): Promise<CartView> {
    const cart = await this.getOrCreateCart.execute(
      command.userId,
      command.channel,
    );
    const product = await this.getProductById.execute(
      new GetProductByIdQuery(command.productId, true),
    );
    const resolved = this.pricing.resolve(product, cart.getChannel());
    const seller = product.getSeller();
    const draft = CartItem.create({
      id: null,
      cartId: cart.hasId() ? cart.getId() : null,
      productId: product.getId(),
      sellerId: seller.id,
      sellerShopName: seller.shopName,
      sellerLogoKey: seller.logoKey,
      productNameFa: product.getNameFa(),
      productNameEn: product.getNameEn(),
      imageKey: product.getPrimaryImageKey(),
      packQty: command.packQty,
      pieceQty: command.pieceQty,
      packMultiple: resolved.packMultiple,
      unitPrice: resolved.unitPrice,
      packPrice: resolved.packPrice,
      commissionPercent: resolved.commissionPercent,
      prepaymentAmount: 0,
    });
    const existing = cart.findItemByProductId(product.getId());
    const nextPack = (existing?.getPackQty() ?? 0) + command.packQty;
    const nextPiece = (existing?.getPieceQty() ?? 0) + command.pieceQty;
    const totalUnits = nextPack * resolved.packMultiple + nextPiece;
    this.pricing.assertQuantityAllowed(
      totalUnits,
      resolved,
      product.getQuantity(),
    );
    const lineTotalPreview =
      nextPack * resolved.packPrice +
      nextPiece * resolved.unitPrice +
      Math.round(
        ((nextPack * resolved.packPrice + nextPiece * resolved.unitPrice) *
          resolved.commissionPercent) /
          100,
      );
    const prepayment =
      command.prepaymentAmount ??
      existing?.getPrepaymentAmount() ??
      lineTotalPreview;
    if (existing) {
      existing.updateQuantities(nextPack, nextPiece);
      existing.refreshPricing({
        unitPrice: resolved.unitPrice,
        packPrice: resolved.packPrice,
        packMultiple: resolved.packMultiple,
        commissionPercent: resolved.commissionPercent,
        productNameFa: product.getNameFa(),
        productNameEn: product.getNameEn(),
        imageKey: product.getPrimaryImageKey(),
        sellerShopName: seller.shopName,
        sellerLogoKey: seller.logoKey,
      });
      existing.updatePrepayment(Math.min(prepayment, existing.lineTotal()));
    } else {
      draft.updatePrepayment(Math.min(prepayment, draft.lineTotal()));
      cart.upsertItem(draft);
    }
    const saved = await this.carts.save(cart);
    return CartViewFactory.toView(saved);
  }
}
