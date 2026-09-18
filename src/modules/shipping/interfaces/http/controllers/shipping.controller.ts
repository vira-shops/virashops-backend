import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import QuoteShippingCommand from '../../../domain/application/commands/quote-shipping.command';
import ShippingMethodRegistry from '../../../domain/application/services/shipping-method.registry';
import QuoteShippingUseCase from '../../../domain/application/usecases/quote-shipping.usecase';
import QuoteShippingHttpDto from '../dto/quote-shipping.http-dto';

@ApiTags('shipping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_BUYER, Role.WHOLESALE_BUYER)
@Controller('shipping')
export default class ShippingController {
  constructor(
    private readonly quoteShipping: QuoteShippingUseCase,
    private readonly registry: ShippingMethodRegistry,
  ) {}

  @Get('methods')
  @ApiOperation({ summary: 'List shipping methods' })
  listMethods() {
    return ApiResponse.of(
      this.registry.list().map((method) => ({ name: method.name })),
    );
  }

  @Post('quote')
  @ApiOperation({ summary: 'Quote shipping for a seller invoice' })
  async quote(@CurrentUser() user: User, @Body() dto: QuoteShippingHttpDto) {
    const quote = await this.quoteShipping.execute(
      new QuoteShippingCommand(
        user.getId(),
        dto.sellerId,
        dto.addressId,
        dto.method,
      ),
    );
    return ApiResponse.of(quote);
  }
}
