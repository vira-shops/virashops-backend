import {
  Body,
  Controller,
  Delete,
  Get,
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
import CreateSellerWarehouseCommand from '../../../domain/application/commands/create-seller-warehouse.command';
import DeleteSellerWarehouseCommand from '../../../domain/application/commands/delete-seller-warehouse.command';
import UpdateSellerProfileCommand from '../../../domain/application/commands/update-seller-profile.command';
import UpdateSellerWarehouseCommand from '../../../domain/application/commands/update-seller-warehouse.command';
import GetSellerProfileQuery from '../../../domain/application/queries/get-seller-profile.query';
import CreateSellerWarehouseUseCase from '../../../domain/application/usecases/create-seller-warehouse.usecase';
import DeleteSellerWarehouseUseCase from '../../../domain/application/usecases/delete-seller-warehouse.usecase';
import GetSellerProfileUseCase from '../../../domain/application/usecases/get-seller-profile.usecase';
import UpdateSellerProfileUseCase from '../../../domain/application/usecases/update-seller-profile.usecase';
import UpdateSellerWarehouseUseCase from '../../../domain/application/usecases/update-seller-warehouse.usecase';
import UpdateSellerProfileHttpDto from '../dto/update-seller-profile.http-dto';
import UpsertSellerWarehouseHttpDto from '../dto/upsert-seller-warehouse.http-dto';

@ApiTags('seller-profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.WHOLESALE_SELLER)
@Controller('seller')
export default class SellerProfileController {
  constructor(
    private readonly getProfile: GetSellerProfileUseCase,
    private readonly updateProfile: UpdateSellerProfileUseCase,
    private readonly createWarehouse: CreateSellerWarehouseUseCase,
    private readonly updateWarehouse: UpdateSellerWarehouseUseCase,
    private readonly deleteWarehouse: DeleteSellerWarehouseUseCase,
  ) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get wholesale seller profile (personal + booth + warehouses)',
  })
  async get(@CurrentUser() user: User) {
    const data = await this.getProfile.execute(
      new GetSellerProfileQuery(user.getId()),
    );
    return ApiResponse.of(data);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update personal + business booth fields' })
  async update(
    @CurrentUser() user: User,
    @Body() dto: UpdateSellerProfileHttpDto,
  ) {
    const data = await this.updateProfile.execute(
      new UpdateSellerProfileCommand(
        user.getId(),
        dto.firstName,
        dto.lastName,
        dto.nationalId,
        dto.dateOfBirth,
        dto.gender,
        dto.avatarKey,
        dto.shopName,
        dto.workplacePhone,
        dto.province,
        dto.city,
        dto.postalCode,
        dto.salesType,
        dto.address,
        dto.industryType,
        dto.category,
        dto.activityType,
        dto.documentType,
        dto.documentKey,
      ),
    );
    return ApiResponse.of(data);
  }

  @Post('warehouses')
  @ApiOperation({ summary: 'Add a warehouse (انبار)' })
  async addWarehouse(
    @CurrentUser() user: User,
    @Body() dto: UpsertSellerWarehouseHttpDto,
  ) {
    const data = await this.createWarehouse.execute(
      new CreateSellerWarehouseCommand(
        user.getId(),
        dto.phone,
        dto.postalCode,
        dto.city,
        dto.address,
      ),
    );
    return ApiResponse.of(data);
  }

  @Patch('warehouses/:id')
  @ApiOperation({ summary: 'Update a warehouse' })
  async patchWarehouse(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertSellerWarehouseHttpDto,
  ) {
    const data = await this.updateWarehouse.execute(
      new UpdateSellerWarehouseCommand(
        user.getId(),
        id,
        dto.phone,
        dto.postalCode,
        dto.city,
        dto.address,
      ),
    );
    return ApiResponse.of(data);
  }

  @Delete('warehouses/:id')
  @ApiOperation({ summary: 'Remove a warehouse' })
  async removeWarehouse(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.deleteWarehouse.execute(
      new DeleteSellerWarehouseCommand(user.getId(), id),
    );
    return ApiResponse.of({ ok: true });
  }
}
