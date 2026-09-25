import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import GetOrderQuery from '../../../domain/application/queries/get-order.query';
import ListOrdersQuery from '../../../domain/application/queries/list-orders.query';
import GetOrderUseCase from '../../../domain/application/usecases/get-order.usecase';
import ListOrdersUseCase from '../../../domain/application/usecases/list-orders.usecase';
import CheckoutHttpMapper from '../mappers/checkout-http.mapper';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_BUYER, Role.WHOLESALE_BUYER)
@Controller('orders')
export default class OrdersController {
  constructor(
    private readonly listOrders: ListOrdersUseCase,
    private readonly getOrder: GetOrderUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List my orders (Figma table: tracking, amount, items, payment status, date)',
  })
  @ApiQuery({ name: 'fromDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'toDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(
    @CurrentUser() user: User,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    const result = await this.listOrders.execute(
      new ListOrdersQuery(
        user.getId(),
        fromDate ?? null,
        toDate ?? null,
        null,
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
  @ApiOperation({ summary: 'Get order detail' })
  async get(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const order = await this.getOrder.execute(
      new GetOrderQuery(user.getId(), id),
    );
    return ApiResponse.of(CheckoutHttpMapper.orderToResponse(order));
  }
}
