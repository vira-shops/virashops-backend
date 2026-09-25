import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import UpdateRetailSellerProfileCommand from '../../../domain/application/commands/update-retail-seller-profile.command';
import GetRetailSellerProfileQuery from '../../../domain/application/queries/get-retail-seller-profile.query';
import GetRetailSellerProfileUseCase from '../../../domain/application/usecases/get-retail-seller-profile.usecase';
import UpdateRetailSellerProfileUseCase from '../../../domain/application/usecases/update-retail-seller-profile.usecase';
import UpdateRetailSellerProfileHttpDto from '../dto/update-retail-seller-profile.http-dto';

@ApiTags('retail-seller-profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_SELLER)
@Controller('retail-seller/profile')
export default class RetailSellerProfileController {
  constructor(
    private readonly getProfile: GetRetailSellerProfileUseCase,
    private readonly updateProfile: UpdateRetailSellerProfileUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get retail seller personal profile' })
  async get(@CurrentUser() user: User) {
    const data = await this.getProfile.execute(
      new GetRetailSellerProfileQuery(user.getId()),
    );
    return ApiResponse.of(data);
  }

  @Patch()
  @ApiOperation({ summary: 'Update retail seller personal profile' })
  async update(
    @CurrentUser() user: User,
    @Body() dto: UpdateRetailSellerProfileHttpDto,
  ) {
    const data = await this.updateProfile.execute(
      new UpdateRetailSellerProfileCommand(
        user.getId(),
        dto.firstName,
        dto.lastName,
        dto.email,
        dto.nationalId,
        dto.dateOfBirth,
        dto.gender,
        dto.province,
        dto.city,
        dto.occupation,
        dto.address,
        dto.postalCode,
        dto.latitude,
        dto.longitude,
        dto.avatarKey,
      ),
    );
    return ApiResponse.of(data);
  }
}
