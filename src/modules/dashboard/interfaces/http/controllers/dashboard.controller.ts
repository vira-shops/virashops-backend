import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import GetBuyerDashboardQuery from '../../../domain/application/queries/get-buyer-dashboard.query';
import GetBuyerDashboardUseCase from '../../../domain/application/usecases/get-buyer-dashboard.usecase';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_BUYER, Role.WHOLESALE_BUYER)
@Controller('dashboard')
export default class DashboardController {
  constructor(private readonly getDashboard: GetBuyerDashboardUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Buyer customer dashboard home' })
  async home(@CurrentUser() user: User) {
    const data = await this.getDashboard.execute(
      new GetBuyerDashboardQuery(user.getId()),
    );
    return ApiResponse.of(data);
  }
}
