import CatalogChannel from '../../model/enums/catalog-channel.enum';

export default class GetProductBySlugQuery {
  constructor(
    readonly slug: string,
    readonly lang: string,
    readonly channel: CatalogChannel = CatalogChannel.RETAIL,
  ) {}
}
