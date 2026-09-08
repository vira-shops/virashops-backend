import CatalogChannel from '../../model/enums/catalog-channel.enum';
import ProductSort from '../../model/enums/product-sort.enum';

export default class ListProductsQuery {
  constructor(
    readonly lang: string,
    readonly channel: CatalogChannel = CatalogChannel.RETAIL,
    readonly page: number = 1,
    readonly limit: number = 20,
    readonly sort: ProductSort = ProductSort.RELEVANT,
    readonly categoryId?: number,
    readonly categorySlug?: string,
    readonly query?: string,
    readonly minPrice?: number,
    readonly maxPrice?: number,
  ) {}
}
