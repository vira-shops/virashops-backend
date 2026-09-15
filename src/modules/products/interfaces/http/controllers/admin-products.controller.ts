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
import SetProductImagesUseCase from '../../../domain/application/usecases/set-product-images.usecase';
import SetProductImagesHttpDto from '../dto/set-product-images.http-dto';
import { toSetProductImagesCommand } from '../mappers/product-images-http.mapper';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export default class AdminProductsController {
  constructor(private readonly setProductImages: SetProductImagesUseCase) {}

  @Put(':id/images')
  @ApiOperation({
    summary: 'Admin: replace any product gallery with uploaded file keys',
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
