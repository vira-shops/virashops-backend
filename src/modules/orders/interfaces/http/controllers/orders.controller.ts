import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
  @ApiOperation({ summary: 'List my orders' })
  async list(@CurrentUser() user: User) {
    const orders = await this.listOrders.execute(
      new ListOrdersQuery(user.getId()),
    );
    return ApiResponse.of(
      orders.map((order) => CheckoutHttpMapper.orderToResponse(order)),
    );
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
