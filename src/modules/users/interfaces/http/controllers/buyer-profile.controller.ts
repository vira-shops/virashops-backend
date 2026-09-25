import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import UpdateBuyerProfileCommand from '../../../domain/application/commands/update-buyer-profile.command';
import GetBuyerProfileQuery from '../../../domain/application/queries/get-buyer-profile.query';
import GetBuyerProfileUseCase from '../../../domain/application/usecases/get-buyer-profile.usecase';
import UpdateBuyerProfileUseCase from '../../../domain/application/usecases/update-buyer-profile.usecase';
import Role from '../../../domain/model/enums/role.enum';
import User from '../../../domain/model/user.model';
import CurrentUser from '../decorators/current-user.decorator';
import Roles from '../decorators/roles.decorator';
import JwtAuthGuard from '../guards/jwt-auth.guard';
import RolesGuard from '../guards/roles.guard';
import UpdateBuyerProfileHttpDto from '../dto/update-buyer-profile.http-dto';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_BUYER, Role.WHOLESALE_BUYER)
@Controller('profile')
export default class BuyerProfileController {
  constructor(
    private readonly getProfile: GetBuyerProfileUseCase,
    private readonly updateProfile: UpdateBuyerProfileUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get my buyer profile (customer dashboard)' })
  async get(@CurrentUser() user: User) {
    const data = await this.getProfile.execute(
      new GetBuyerProfileQuery(user.getId()),
    );
    return ApiResponse.of(data);
  }

  @Patch()
  @ApiOperation({ summary: 'Update my buyer profile (customer dashboard)' })
  async update(
    @CurrentUser() user: User,
    @Body() dto: UpdateBuyerProfileHttpDto,
  ) {
    const data = await this.updateProfile.execute(
      new UpdateBuyerProfileCommand(
        user.getId(),
        dto.firstName,
        dto.lastName,
        dto.nationalId,
        dto.dateOfBirth,
        dto.gender,
        dto.avatarKey,
        dto.businessName,
        dto.businessPhone,
        dto.postalCode,
        dto.province,
        dto.city,
        dto.address,
        dto.identityType,
        dto.documentKey1,
        dto.documentKey2,
      ),
    );
    return ApiResponse.of(data);
  }
}
