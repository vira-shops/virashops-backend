import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import CompleteSellerProfileCommand from '../../../domain/application/commands/complete-seller-profile.command';
import CompleteSellerProfileUseCase from '../../../domain/application/usecases/complete-seller-profile.usecase';
import CompleteSellerProfileHttpDto from '../dto/complete-seller-profile.http-dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth/sellers')
@UseGuards(JwtAuthGuard)
export default class SellerAuthController {
  constructor(private readonly completeProfile: CompleteSellerProfileUseCase) {}

  @Patch('me')
  @ApiOperation({ summary: 'Complete seller booth profile after signup' })
  async complete(
    @CurrentUser() user: User,
    @Body() dto: CompleteSellerProfileHttpDto,
  ) {
    const seller = await this.completeProfile.execute(
      new CompleteSellerProfileCommand(
        user.getId(),
        dto.shopName,
        dto.workplacePhone ?? null,
        dto.province,
        dto.city,
        dto.postalCode ?? null,
        dto.salesType,
        dto.address,
      ),
    );
    return ApiResponse.of({
      id: seller.getId(),
      kind: seller.getKind(),
      status: seller.getStatus(),
      shopName: seller.getShopName(),
      profileComplete: seller.isProfileComplete(),
    });
  }
}
