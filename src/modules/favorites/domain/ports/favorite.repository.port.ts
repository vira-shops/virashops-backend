import Favorite from '../model/favorite.model';

export default interface FavoriteRepositoryPort {
  listByUserId(userId: number): Promise<Favorite[]>;
  findByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<Favorite | null>;
  save(favorite: Favorite): Promise<Favorite>;
  deleteByUserAndProduct(userId: number, productId: number): Promise<void>;
}
