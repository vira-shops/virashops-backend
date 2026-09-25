import { Inject, Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import type FavoriteRepositoryPort from '../../ports/favorite.repository.port';
import { FAVORITE_REPOSITORY } from '../../../shared/tokens/port.token';
import ListFavoritesQuery from '../queries/list-favorites.query';

export type FavoriteCardView = {
  productId: number;
  nameFa: string;
  nameEn: string;
  price: number;
  imageKey: string | null;
  favoriteId: number;
};

@Injectable()
export default class ListFavoritesUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favorites: FavoriteRepositoryPort,
    private readonly getProductById: GetProductByIdUseCase,
  ) {}

  async execute(query: ListFavoritesQuery): Promise<FavoriteCardView[]> {
    const favorites = await this.favorites.listByUserId(query.userId);
    const cards: FavoriteCardView[] = [];
    for (const favorite of favorites) {
      try {
        const product = await this.getProductById.execute(
          new GetProductByIdQuery(favorite.getProductId(), true),
        );
        cards.push({
          productId: product.getId(),
          nameFa: product.getNameFa(),
          nameEn: product.getNameEn(),
          price: product.getRetailPrice(),
          imageKey: product.getPrimaryImageKey(),
          favoriteId: favorite.getId(),
        });
      } catch {
        // skip unavailable products
      }
    }
    return cards;
  }
}
