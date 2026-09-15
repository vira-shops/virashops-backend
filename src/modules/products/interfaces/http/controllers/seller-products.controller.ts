import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Put,
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
import SellerActiveGuard from '../../../../sellers/interfaces/http/guards/seller-active.guard';
import SetProductImagesUseCase from '../../../domain/application/usecases/set-product-images.usecase';
import SetProductImagesHttpDto from '../dto/set-product-images.http-dto';
import { toSetProductImagesCommand } from '../mappers/product-images-http.mapper';

@ApiTags('seller-products')
@ApiBearerAuth()
@Controller('seller/products')
@UseGuards(JwtAuthGuard, RolesGuard, SellerActiveGuard)
@Roles(Role.RETAIL_SELLER, Role.WHOLESALE_SELLER)
export default class SellerProductsController {
  constructor(private readonly setProductImages: SetProductImagesUseCase) {}

  @Put(':id/images')
  @ApiOperation({
    summary: 'Replace product gallery with keys from POST /files/upload',
  })
  async setImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetProductImagesHttpDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.setProductImages.execute(
      toSetProductImagesCommand(id, user.getId(), user.getRoles(), dto),
    );
    return ApiResponse.of(data);
  }
}
