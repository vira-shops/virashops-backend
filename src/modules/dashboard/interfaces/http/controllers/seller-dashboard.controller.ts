import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import SellerActiveGuard from '../../../../sellers/interfaces/http/guards/seller-active.guard';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import GetSellerDashboardQuery from '../../../domain/application/queries/get-seller-dashboard.query';
import GetSellerDashboardUseCase from '../../../domain/application/usecases/get-seller-dashboard.usecase';

@ApiTags('seller-dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SellerActiveGuard)
@Roles(Role.WHOLESALE_SELLER, Role.RETAIL_SELLER)
@Controller('seller/dashboard')
export default class SellerDashboardController {
  constructor(private readonly getDashboard: GetSellerDashboardUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Seller dashboard home (wholesale or retail)' })
  async home(@CurrentUser() user: User) {
    const data = await this.getDashboard.execute(
      new GetSellerDashboardQuery(user.getId()),
    );
    return ApiResponse.of(data);
  }
}
