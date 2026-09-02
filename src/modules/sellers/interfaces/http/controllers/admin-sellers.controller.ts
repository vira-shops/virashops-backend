import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
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
import UpdateSellerStatusCommand from '../../../domain/application/commands/update-seller-status.command';
import UpdateSellerStatusUseCase from '../../../domain/application/usecases/update-seller-status.usecase';
import UpdateSellerStatusHttpDto from '../dto/update-seller-status.http-dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/sellers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export default class AdminSellersController {
  constructor(private readonly updateStatus: UpdateSellerStatusUseCase) {}

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: change seller status' })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSellerStatusHttpDto,
    @CurrentUser() actor: User,
  ) {
    const seller = await this.updateStatus.execute(
      new UpdateSellerStatusCommand(id, dto.status, actor.getRoles()),
    );
    return ApiResponse.of({
      id: seller.getId(),
      status: seller.getStatus(),
      kind: seller.getKind(),
      shopName: seller.getShopName(),
    });
  }
}
