import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import SellerActiveGuard from '../../../../sellers/interfaces/http/guards/seller-active.guard';
import GetSellerByUserIdQuery from '../../../../sellers/domain/application/queries/get-seller-by-user-id.query';
import GetSellerByUserIdUseCase from '../../../../sellers/domain/application/usecases/get-seller-by-user-id.usecase';
import SellerNotFoundError from '../../../../sellers/domain/errors/seller-not-found.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import UpdateSellerOrderStatusCommand from '../../../domain/application/commands/update-seller-order-status.command';
import GetSellerOrderQuery from '../../../domain/application/queries/get-seller-order.query';
import ListSellerOrdersQuery from '../../../domain/application/queries/list-seller-orders.query';
import GetSellerOrderUseCase from '../../../domain/application/usecases/get-seller-order.usecase';
import ListSellerOrdersUseCase from '../../../domain/application/usecases/list-seller-orders.usecase';
import UpdateSellerOrderStatusUseCase from '../../../domain/application/usecases/update-seller-order-status.usecase';
import OrderStatus from '../../../domain/model/enums/order-status.enum';
import UpdateSellerOrderStatusHttpDto from '../dto/update-seller-order-status.http-dto';
import CheckoutHttpMapper from '../mappers/checkout-http.mapper';

@ApiTags('seller-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SellerActiveGuard)
@Roles(Role.WHOLESALE_SELLER, Role.RETAIL_SELLER)
@Controller('seller/orders')
export default class SellerOrdersController {
  constructor(
    private readonly listOrders: ListSellerOrdersUseCase,
    private readonly getOrder: GetSellerOrderUseCase,
    private readonly updateStatus: UpdateSellerOrderStatusUseCase,
    private readonly getSellerByUserId: GetSellerByUserIdUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List orders for my seller booth' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(
    @CurrentUser() user: User,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const sellerId = await this.requireSellerId(user.getId());
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    const statusFilter =
      status && Object.values(OrderStatus).includes(status as OrderStatus)
        ? (status as OrderStatus)
        : null;
    const result = await this.listOrders.execute(
      new ListSellerOrdersQuery(
        sellerId,
        fromDate ?? null,
        toDate ?? null,
        statusFilter,
        pageNum,
        limitNum,
      ),
    );
    return ApiResponse.of({
      items: result.items.map((order) =>
        CheckoutHttpMapper.orderListToResponse(order),
      ),
      total: result.total,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seller order detail' })
  async get(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const sellerId = await this.requireSellerId(user.getId());
    const order = await this.getOrder.execute(
      new GetSellerOrderQuery(sellerId, id),
    );
    return ApiResponse.of(CheckoutHttpMapper.orderToResponse(order));
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update seller order status' })
  async changeStatus(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSellerOrderStatusHttpDto,
  ) {
    const sellerId = await this.requireSellerId(user.getId());
    const order = await this.updateStatus.execute(
      new UpdateSellerOrderStatusCommand(sellerId, id, dto.status),
    );
    return ApiResponse.of(CheckoutHttpMapper.orderToResponse(order));
  }

  private async requireSellerId(userId: number): Promise<number> {
    const seller = await this.getSellerByUserId.execute(
      new GetSellerByUserIdQuery(userId),
    );
    if (!seller) {
      throw new SellerNotFoundError();
    }
    return seller.id;
  }
}
