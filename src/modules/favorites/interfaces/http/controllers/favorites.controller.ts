import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import AddFavoriteCommand from '../../../domain/application/commands/add-favorite.command';
import RemoveFavoriteCommand from '../../../domain/application/commands/remove-favorite.command';
import ListFavoritesQuery from '../../../domain/application/queries/list-favorites.query';
import AddFavoriteUseCase from '../../../domain/application/usecases/add-favorite.usecase';
import ListFavoritesUseCase from '../../../domain/application/usecases/list-favorites.usecase';
import RemoveFavoriteUseCase from '../../../domain/application/usecases/remove-favorite.usecase';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.RETAIL_BUYER,
  Role.WHOLESALE_BUYER,
  Role.WHOLESALE_SELLER,
  Role.RETAIL_SELLER,
)
@Controller('favorites')
export default class FavoritesController {
  constructor(
    private readonly listFavorites: ListFavoritesUseCase,
    private readonly addFavorite: AddFavoriteUseCase,
    private readonly removeFavorite: RemoveFavoriteUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my favorite products' })
  async list(@CurrentUser() user: User) {
    const items = await this.listFavorites.execute(
      new ListFavoritesQuery(user.getId()),
    );
    return ApiResponse.of(items);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add product to favorites' })
  async add(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const favorite = await this.addFavorite.execute(
      new AddFavoriteCommand(user.getId(), productId),
    );
    return ApiResponse.of({
      id: favorite.getId(),
      productId: favorite.getProductId(),
    });
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from favorites' })
  async remove(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    await this.removeFavorite.execute(
      new RemoveFavoriteCommand(user.getId(), productId),
    );
    return ApiResponse.of({ removed: true });
  }
}
