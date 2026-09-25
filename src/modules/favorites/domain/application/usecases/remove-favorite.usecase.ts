import { Inject, Injectable } from '@nestjs/common';
import type FavoriteRepositoryPort from '../../ports/favorite.repository.port';
import { FAVORITE_REPOSITORY } from '../../../shared/tokens/port.token';
import RemoveFavoriteCommand from '../commands/remove-favorite.command';

@Injectable()
export default class RemoveFavoriteUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favorites: FavoriteRepositoryPort,
  ) {}

  async execute(command: RemoveFavoriteCommand): Promise<void> {
    await this.favorites.deleteByUserAndProduct(
      command.userId,
      command.productId,
    );
  }
}
