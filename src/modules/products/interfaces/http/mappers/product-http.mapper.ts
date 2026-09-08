import CatalogChannel from '../../../domain/model/enums/catalog-channel.enum';
import ProductSort from '../../../domain/model/enums/product-sort.enum';
import GetProductBySlugQuery from '../../../domain/application/queries/get-product-by-slug.query';
import ListProductsQuery from '../../../domain/application/queries/list-products.query';
import GetProductHttpDto from '../dto/get-product.http-dto';
import ListProductsHttpDto from '../dto/list-products.http-dto';

export function requestLang(lang?: string): string {
  const value = (lang ?? 'en').trim().toLowerCase();
  return value.startsWith('fa') ? 'fa' : 'en';
}

export function toListProductsQuery(
  dto: ListProductsHttpDto,
  lang: string,
): ListProductsQuery {
  return new ListProductsQuery(
    requestLang(lang),
    dto.channel ?? CatalogChannel.RETAIL,
    dto.page ?? 1,
    dto.limit ?? 20,
    dto.sort ?? ProductSort.RELEVANT,
    dto.categoryId,
    dto.categorySlug,
    dto.q,
    dto.minPrice,
    dto.maxPrice,
  );
}

export function toGetProductBySlugQuery(
  slug: string,
  dto: GetProductHttpDto,
  lang: string,
): GetProductBySlugQuery {
  return new GetProductBySlugQuery(
    slug,
    requestLang(lang),
    dto.channel ?? CatalogChannel.RETAIL,
  );
}
