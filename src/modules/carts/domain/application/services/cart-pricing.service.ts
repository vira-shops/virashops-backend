import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CatalogChannel from '../../../../products/domain/model/enums/catalog-channel.enum';
import Product from '../../../../products/domain/model/product.model';
import CartChannel from '../../model/enums/cart-channel.enum';
import InvalidCartQuantityError from '../../errors/invalid-cart-quantity.error';

export type ResolvedCartPricing = {
  unitPrice: number;
  packPrice: number;
  packMultiple: number;
  commissionPercent: number;
  moq: number;
  maxQty: number | null;
};

@Injectable()
export default class CartPricingService {
  constructor(private readonly config: ConfigService) {}

  commissionPercent(): number {
    return this.config.get<number>('PLATFORM_COMMISSION_PERCENT') ?? 5;
  }

  resolve(product: Product, channel: CartChannel): ResolvedCartPricing {
    const catalogChannel =
      channel === CartChannel.WHOLESALE
        ? CatalogChannel.WHOLESALE
        : CatalogChannel.RETAIL;
    const unitPrice = product.getUnitPrice(catalogChannel);
    const wholesale = product.getWholesale();
    const packMultiple =
      channel === CartChannel.WHOLESALE ? (wholesale?.packMultiple ?? 1) : 1;
    const packPrice =
      channel === CartChannel.WHOLESALE
        ? (wholesale?.packPrice ?? unitPrice * packMultiple)
        : unitPrice * packMultiple;
    return {
      unitPrice,
      packPrice,
      packMultiple,
      commissionPercent: this.commissionPercent(),
      moq: channel === CartChannel.WHOLESALE ? (wholesale?.moq ?? 1) : 1,
      maxQty:
        channel === CartChannel.WHOLESALE ? (wholesale?.maxQty ?? null) : null,
    };
  }

  assertQuantityAllowed(
    totalUnits: number,
    pricing: ResolvedCartPricing,
    stock: number,
  ): void {
    if (totalUnits < pricing.moq) {
      throw new InvalidCartQuantityError(
        `Quantity must be at least ${pricing.moq}`,
      );
    }
    if (pricing.maxQty !== null && totalUnits > pricing.maxQty) {
      throw new InvalidCartQuantityError(
        `Quantity must be at most ${pricing.maxQty}`,
      );
    }
    if (totalUnits > stock) {
      throw new InvalidCartQuantityError('Insufficient stock');
    }
    // Pack multiples are enforced at MOQ; pack+piece UI may leave remainder pieces.
  }
}
