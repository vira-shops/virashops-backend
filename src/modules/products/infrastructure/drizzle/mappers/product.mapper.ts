import Product from '../../../domain/model/product.model';
import ProductStatus from '../../../domain/model/enums/product-status.enum';
import type {
  ProductImageProps,
  ProductPriceTierProps,
  ProductSpecProps,
  ProductWholesaleProps,
} from '../../../domain/model/product.types';
import type {
  ProductImageRow,
  ProductPriceTierRow,
  ProductRow,
} from '../schema/products';

export default class ProductMapper {
  static toDomain(
    row: ProductRow,
    images: ProductImageRow[],
    tiers: ProductPriceTierRow[],
  ): Product {
    return Product.restore({
      id: row.id,
      seller: {
        id: row.sellerId,
        shopName: row.sellerShopName,
        logoKey: row.sellerLogoKey,
      },
      category: {
        id: row.categoryId,
        slug: row.categorySlug,
        nameFa: row.categoryNameFa,
        nameEn: row.categoryNameEn,
        parentId: row.parentCategoryId,
      },
      slug: row.slug,
      nameFa: row.nameFa,
      nameEn: row.nameEn,
      shortDescriptionFa: row.shortDescriptionFa,
      shortDescriptionEn: row.shortDescriptionEn,
      descriptionFa: row.descriptionFa,
      descriptionEn: row.descriptionEn,
      brand: row.brand,
      sku: row.sku,
      status: row.status as ProductStatus,
      published: row.published,
      quantity: row.quantity,
      lowStockThreshold: row.lowStockThreshold,
      retailPrice: row.retailPrice,
      compareAtPrice: row.compareAtPrice,
      discountPercent: row.discountPercent,
      wholesale: ProductMapper.toWholesale(row, tiers),
      specs: ProductMapper.toSpecs(row.specs),
      images: images.map((image) => ProductMapper.toImage(image)),
      productionDate: row.productionDate,
      expiryDate: row.expiryDate,
      catalogKey: row.catalogKey,
      sortOrder: row.sortOrder,
      updatedAt: row.updatedAt,
    });
  }

  private static toImage(row: ProductImageRow): ProductImageProps {
    return {
      imageKey: row.imageKey,
      altFa: row.altFa,
      altEn: row.altEn,
      isPrimary: row.isPrimary,
      sortOrder: row.sortOrder,
    };
  }

  private static toSpecs(value: ProductSpecProps[] | null): ProductSpecProps[] {
    return Array.isArray(value) ? value : [];
  }

  private static toWholesale(
    row: ProductRow,
    tiers: ProductPriceTierRow[],
  ): ProductWholesaleProps | null {
    if (
      row.wholesaleMoq === null &&
      row.wholesaleCashPrice === null &&
      row.wholesalePackPrice === null &&
      tiers.length === 0
    ) {
      return null;
    }

    const installment =
      row.wholesaleInstallmentMonths !== null &&
      row.wholesaleInstallmentFeePercent !== null
        ? {
            months: row.wholesaleInstallmentMonths,
            monthlyFeePercent: row.wholesaleInstallmentFeePercent,
          }
        : null;

    return {
      moq: row.wholesaleMoq ?? 1,
      maxQty: row.wholesaleMaxQty,
      packMultiple: row.wholesalePackMultiple ?? 1,
      cashPrice: row.wholesaleCashPrice,
      packPrice: row.wholesalePackPrice,
      installment,
      tiers: tiers.map((tier): ProductPriceTierProps => ({
        minQty: tier.minQty,
        maxQty: tier.maxQty,
        unitPrice: tier.unitPrice,
      })),
    };
  }
}
