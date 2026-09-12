import CatalogChannel from '../../../../products/domain/model/enums/catalog-channel.enum';
import ProductSort from '../../../../products/domain/model/enums/product-sort.enum';

export default class SearchCatalogQuery {
  constructor(
    readonly query: string,
    readonly lang: string,
    readonly page: number = 1,
    readonly limit: number = 20,
    readonly channel: CatalogChannel = CatalogChannel.RETAIL,
    readonly sort: ProductSort = ProductSort.RELEVANT,
    readonly categoryId?: number,
    readonly minPrice?: number,
    readonly maxPrice?: number,
  ) {}
}
