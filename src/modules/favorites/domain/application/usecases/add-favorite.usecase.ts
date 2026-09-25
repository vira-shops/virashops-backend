import { Inject, Injectable } from '@nestjs/common';
import GetProductByIdQuery from '../../../../products/domain/application/queries/get-product-by-id.query';
import GetProductByIdUseCase from '../../../../products/domain/application/usecases/get-product-by-id.usecase';
import Favorite from '../../model/favorite.model';
import type FavoriteRepositoryPort from '../../ports/favorite.repository.port';
import { FAVORITE_REPOSITORY } from '../../../shared/tokens/port.token';
import AddFavoriteCommand from '../commands/add-favorite.command';

@Injectable()
export default class AddFavoriteUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favorites: FavoriteRepositoryPort,
    private readonly getProductById: GetProductByIdUseCase,
  ) {}

  async execute(command: AddFavoriteCommand): Promise<Favorite> {
    await this.getProductById.execute(
      new GetProductByIdQuery(command.productId, true),
    );
    const existing = await this.favorites.findByUserAndProduct(
      command.userId,
      command.productId,
    );
    if (existing) {
      return existing;
    }
    return this.favorites.save(
      Favorite.create(command.userId, command.productId),
    );
  }
}
