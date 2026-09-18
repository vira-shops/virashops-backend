import { Inject, Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import CartItemNotFoundError from '../../errors/cart-item-not-found.error';
import type CartRepositoryPort from '../../ports/cart.repository.port';
import { CART_REPOSITORY } from '../../../shared/tokens/port.token';
import CartPricingService from '../services/cart-pricing.service';
import CartViewFactory from '../services/cart-view.factory';
import UpdateCartItemCommand from '../commands/update-cart-item.command';
import GetOrCreateCartUseCase from './get-or-create-cart.usecase';
import type { CartView } from '../../view-models/cart-invoice.view';

@Injectable()
export default class UpdateCartItemUseCase {
  constructor(
    private readonly getOrCreateCart: GetOrCreateCartUseCase,
    private readonly getProductById: GetProductByIdUseCase,
    private readonly pricing: CartPricingService,
    @Inject(CART_REPOSITORY)
    private readonly carts: CartRepositoryPort,
  ) {}

  async execute(command: UpdateCartItemCommand): Promise<CartView> {
    const cart = await this.getOrCreateCart.execute(command.userId);
    const item = cart.findItemById(command.itemId);
    if (!item) {
      throw new CartItemNotFoundError();
    }
    const product = await this.getProductById.execute(
      new GetProductByIdQuery(item.getProductId(), true),
    );
    const resolved = this.pricing.resolve(product, cart.getChannel());
    const totalUnits =
      command.packQty * resolved.packMultiple + command.pieceQty;
    this.pricing.assertQuantityAllowed(
      totalUnits,
      resolved,
      product.getQuantity(),
    );
    item.updateQuantities(command.packQty, command.pieceQty);
    item.refreshPricing({
      unitPrice: resolved.unitPrice,
      packPrice: resolved.packPrice,
      packMultiple: resolved.packMultiple,
      commissionPercent: resolved.commissionPercent,
      productNameFa: product.getNameFa(),
      productNameEn: product.getNameEn(),
      imageKey: product.getPrimaryImageKey(),
      sellerShopName: product.getSeller().shopName,
      sellerLogoKey: product.getSeller().logoKey,
    });
    if (command.prepaymentAmount !== null) {
      item.updatePrepayment(command.prepaymentAmount);
    }
    const saved = await this.carts.save(cart);
    return CartViewFactory.toView(saved);
  }
}
