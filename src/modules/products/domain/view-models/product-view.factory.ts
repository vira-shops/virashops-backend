import CatalogChannel from '../model/enums/catalog-channel.enum';
import Product from '../model/product.model';
import type {
  ProductCardView,
  ProductDetailView,
  ProductImageView,
  ProductSpecView,
  ProductWholesaleView,
} from './product.view-model';

export default class ProductViewFactory {
  static card(
    product: Product,
    lang: string,
    channel: CatalogChannel,
  ): ProductCardView {
    const badges: string[] = [];
    if (product.getDiscountPercent() > 0) {
      badges.push(`${product.getDiscountPercent()}%`);
    }

    return {
      id: product.getId(),
      slug: product.getSlug(),
      name: product.getName(lang),
      imageKey: product.getPrimaryImageKey(),
      price: product.getUnitPrice(channel),
      compareAtPrice: product.getCompareAtPrice(),
      discountPercent: product.getDiscountPercent(),
      badges,
      stockStatus: product.getStockStatus(),
      seller: {
        id: product.getSeller().id,
        shopName: product.getSeller().shopName,
        logoKey: product.getSeller().logoKey,
      },
      storeCount: 1,
      channel,
    };
  }

  static detail(
    product: Product,
    lang: string,
    channel: CatalogChannel,
    related: Product[],
  ): ProductDetailView {
    const isFa = lang.toLowerCase().startsWith('fa');
    const category = product.getCategory();

    return {
      ...ProductViewFactory.card(product, lang, channel),
      shortDescription: product.getShortDescription(lang),
      description: product.getDescription(lang),
      brand: product.getBrand(),
      sku: product.getSku(),
      gallery: product.getImages().map((image): ProductImageView => ({
        imageKey: image.imageKey,
        alt: isFa ? image.altFa : image.altEn,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
      })),
      specs: product.getSpecs().map((spec): ProductSpecView => ({
        key: spec.key,
        label: isFa ? spec.labelFa : spec.labelEn,
        value: isFa ? spec.valueFa : spec.valueEn,
      })),
      productionDate: product.getProductionDate(),
      expiryDate: product.getExpiryDate(),
      category: {
        id: category.id,
        slug: category.slug,
        name: isFa ? category.nameFa : category.nameEn,
      },
      wholesale:
        channel === CatalogChannel.WHOLESALE
          ? ProductViewFactory.wholesale(product)
          : null,
      related: related.map((item) =>
        ProductViewFactory.card(item, lang, channel),
      ),
    };
  }

  private static wholesale(product: Product): ProductWholesaleView | null {
    const wholesale = product.getWholesale();
    if (!wholesale || !product.hasWholesale()) {
      return null;
    }
    return {
      moq: wholesale.moq,
      maxQty: wholesale.maxQty,
      packMultiple: wholesale.packMultiple,
      cashPrice: wholesale.cashPrice,
      packPrice: wholesale.packPrice,
      installment: wholesale.installment,
      tiers: wholesale.tiers,
    };
  }
}
