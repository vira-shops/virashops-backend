import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import AddCartItemCommand from '../../../domain/application/commands/add-cart-item.command';
import ClearCartCommand from '../../../domain/application/commands/clear-cart.command';
import RemoveCartItemCommand from '../../../domain/application/commands/remove-cart-item.command';
import UpdateCartItemCommand from '../../../domain/application/commands/update-cart-item.command';
import GetCartQuery from '../../../domain/application/queries/get-cart.query';
import AddCartItemUseCase from '../../../domain/application/usecases/add-cart-item.usecase';
import ClearCartUseCase from '../../../domain/application/usecases/clear-cart.usecase';
import GetCartUseCase from '../../../domain/application/usecases/get-cart.usecase';
import RemoveCartItemUseCase from '../../../domain/application/usecases/remove-cart-item.usecase';
import UpdateCartItemUseCase from '../../../domain/application/usecases/update-cart-item.usecase';
import CartChannel from '../../../domain/model/enums/cart-channel.enum';
import AddCartItemHttpDto from '../dto/add-cart-item.http-dto';
import UpdateCartItemHttpDto from '../dto/update-cart-item.http-dto';

@ApiTags('carts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_BUYER, Role.WHOLESALE_BUYER)
@Controller('cart')
export default class CartsController {
  constructor(
    private readonly getCart: GetCartUseCase,
    private readonly addCartItem: AddCartItemUseCase,
    private readonly updateCartItem: UpdateCartItemUseCase,
    private readonly removeCartItem: RemoveCartItemUseCase,
    private readonly clearCart: ClearCartUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get active cart with invoice grouping' })
  async get(@CurrentUser() user: User) {
    const view = await this.getCart.execute(new GetCartQuery(user.getId()));
    return ApiResponse.of(view);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add product to cart' })
  async add(@CurrentUser() user: User, @Body() dto: AddCartItemHttpDto) {
    const view = await this.addCartItem.execute(
      new AddCartItemCommand(
        user.getId(),
        dto.productId,
        dto.packQty ?? 0,
        dto.pieceQty ?? 0,
        dto.prepaymentAmount ?? null,
        dto.channel ?? CartChannel.WHOLESALE,
      ),
    );
    return ApiResponse.created(view);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart line quantities / prepayment' })
  async update(
    @CurrentUser() user: User,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemHttpDto,
  ) {
    const view = await this.updateCartItem.execute(
      new UpdateCartItemCommand(
        user.getId(),
        itemId,
        dto.packQty,
        dto.pieceQty,
        dto.prepaymentAmount ?? null,
      ),
    );
    return ApiResponse.of(view);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove cart line' })
  async remove(
    @CurrentUser() user: User,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    const view = await this.removeCartItem.execute(
      new RemoveCartItemCommand(user.getId(), itemId),
    );
    return ApiResponse.of(view);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cart' })
  async clear(@CurrentUser() user: User) {
    const view = await this.clearCart.execute(
      new ClearCartCommand(user.getId()),
    );
    return ApiResponse.of(view);
  }
}
