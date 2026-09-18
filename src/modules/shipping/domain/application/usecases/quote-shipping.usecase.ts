import { Injectable } from '@nestjs/common';
import GetAddressForUserUseCase from '../../../../addresses/domain/application/usecases/get-address-for-user.usecase';
import GetSellerCartLinesUseCase from '../../../../carts/domain/application/usecases/get-seller-cart-lines.usecase';
import ShippingMethodRegistry from '../services/shipping-method.registry';
import QuoteShippingCommand from '../commands/quote-shipping.command';
import type { ShippingQuote } from '../../ports/shipping-method.strategy.port';

@Injectable()
export default class QuoteShippingUseCase {
  constructor(
    private readonly registry: ShippingMethodRegistry,
    private readonly getAddress: GetAddressForUserUseCase,
    private readonly getSellerLines: GetSellerCartLinesUseCase,
  ) {}

  async execute(command: QuoteShippingCommand): Promise<ShippingQuote> {
    await this.getAddress.execute(command.addressId, command.userId);
    const items = await this.getSellerLines.execute(
      command.userId,
      command.sellerId,
    );
    const subtotal = items.reduce((sum, item) => sum + item.goodsAmount(), 0);
    const method = this.registry.get(command.method);
    return method.quote({
      sellerId: command.sellerId,
      addressId: command.addressId,
      items: items.map((item) => ({
        productId: item.getProductId(),
        quantity: item.totalUnits(),
        unitPrice: item.getUnitPrice(),
      })),
      subtotal,
    });
  }
}
