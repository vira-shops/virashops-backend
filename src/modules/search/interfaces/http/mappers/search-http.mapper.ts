import CatalogChannel from '../../../../products/domain/model/enums/catalog-channel.enum';
import ProductSort from '../../../../products/domain/model/enums/product-sort.enum';
import SearchCatalogQuery from '../../../domain/application/queries/search-catalog.query';
import SearchCatalogHttpDto from '../dto/search-catalog.http-dto';

export function toCatalogChannel(value?: string): CatalogChannel {
  return value?.trim().toUpperCase() === CatalogChannel.WHOLESALE
    ? CatalogChannel.WHOLESALE
    : CatalogChannel.RETAIL;
}

export function toProductSort(value?: string): ProductSort {
  const normalized = value?.trim().toLowerCase();
  if (normalized === ProductSort.NEWEST || normalized === 'new') {
    return ProductSort.NEWEST;
  }
  if (normalized === ProductSort.CHEAPEST || normalized === 'price_asc') {
    return ProductSort.CHEAPEST;
  }
  return ProductSort.RELEVANT;
}

export function toSearchCatalogQuery(
  dto: SearchCatalogHttpDto,
  lang: string,
): SearchCatalogQuery {
  return new SearchCatalogQuery(
    dto.q ?? '',
    lang,
    dto.page ?? 1,
    dto.limit ?? 20,
    toCatalogChannel(dto.channel),
    toProductSort(dto.sort),
    dto.categoryId,
    dto.minPrice,
    dto.maxPrice,
  );
}
