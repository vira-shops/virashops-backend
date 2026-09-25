import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import { FAVORITE_REPOSITORY } from '../shared/tokens/port.token';
import DrizzleFavoriteRepositoryAdapter from './drizzle/repositories/favorite.repository.adapter';

@Module({
  imports: [CoreInfrastructureModule],
  providers: [
    {
      provide: FAVORITE_REPOSITORY,
      useClass: DrizzleFavoriteRepositoryAdapter,
    },
  ],
  exports: [FAVORITE_REPOSITORY],
})
export default class FavoritesInfrastructureModule {}
