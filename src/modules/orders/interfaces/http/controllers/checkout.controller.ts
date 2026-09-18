import {
  Body,
  Controller,
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
import StartCheckoutCommand from '../../../domain/application/commands/start-checkout.command';
import GetCheckoutSessionQuery from '../../../domain/application/queries/get-checkout-session.query';
import GetCheckoutSessionUseCase from '../../../domain/application/usecases/get-checkout-session.usecase';
import StartCheckoutUseCase from '../../../domain/application/usecases/start-checkout.usecase';
import StartCheckoutHttpDto from '../dto/start-checkout.http-dto';
import CheckoutHttpMapper from '../mappers/checkout-http.mapper';

@ApiTags('checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_BUYER, Role.WHOLESALE_BUYER)
@Controller('checkout')
export default class CheckoutController {
  constructor(
    private readonly startCheckout: StartCheckoutUseCase,
    private readonly getCheckoutSession: GetCheckoutSessionUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Start or refresh checkout session for one seller invoice',
  })
  async start(@CurrentUser() user: User, @Body() dto: StartCheckoutHttpDto) {
    const session = await this.startCheckout.execute(
      new StartCheckoutCommand(
        user.getId(),
        dto.sellerId,
        dto.addressId,
        dto.shippingMethod,
        dto.deliveryDate,
        dto.windowStartHour,
        dto.windowEndHour,
        dto.note ?? null,
      ),
    );
    return ApiResponse.created(CheckoutHttpMapper.sessionToResponse(session));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get checkout session' })
  async get(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const session = await this.getCheckoutSession.execute(
      new GetCheckoutSessionQuery(user.getId(), id),
    );
    return ApiResponse.of(CheckoutHttpMapper.sessionToResponse(session));
  }
}
