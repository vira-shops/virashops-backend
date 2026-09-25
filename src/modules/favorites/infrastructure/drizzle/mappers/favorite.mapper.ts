import Favorite from '../../../domain/model/favorite.model';
import type { FavoriteRow } from '../schema/favorites';

export default class FavoriteMapper {
  static toDomain(row: FavoriteRow): Favorite {
    return Favorite.restore({
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      createdAt: row.createdAt,
    });
  }
}
