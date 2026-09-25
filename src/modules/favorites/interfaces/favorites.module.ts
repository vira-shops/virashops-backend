import { Module } from '@nestjs/common';
import ProductsModule from '../../products/interfaces/products.module';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import AddFavoriteUseCase from '../domain/application/usecases/add-favorite.usecase';
import ListFavoritesUseCase from '../domain/application/usecases/list-favorites.usecase';
import RemoveFavoriteUseCase from '../domain/application/usecases/remove-favorite.usecase';
import FavoritesInfrastructureModule from '../infrastructure/infrastructure.module';
import FavoritesController from './http/controllers/favorites.controller';

@Module({
  imports: [
    FavoritesInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
    ProductsModule,
  ],
  controllers: [FavoritesController],
  providers: [ListFavoritesUseCase, AddFavoriteUseCase, RemoveFavoriteUseCase],
})
export default class FavoritesModule {}
