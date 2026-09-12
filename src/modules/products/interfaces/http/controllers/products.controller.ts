import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import ApiResponse from '../../../../../common/http/api-response';
import GetProductBySlugUseCase from '../../../domain/application/usecases/get-product-by-slug.usecase';
import ListProductsUseCase from '../../../domain/application/usecases/list-products.usecase';
import GetProductHttpDto from '../dto/get-product.http-dto';
import ListProductsHttpDto from '../dto/list-products.http-dto';
import {
  toGetProductBySlugQuery,
  toListProductsQuery,
} from '../mappers/product-http.mapper';

@ApiTags('products')
@Controller('products')
export default class ProductsController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProductBySlug: GetProductBySlugUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Public published product list' })
  async list(@Query() dto: ListProductsHttpDto, @I18nLang() lang: string) {
    const data = await this.listProducts.execute(
      toListProductsQuery(dto, lang),
    );
    return ApiResponse.of(data);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Public product detail with related catalog recommendations',
  })
  async bySlug(
    @Param('slug') slug: string,
    @Query() dto: GetProductHttpDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getProductBySlug.execute(
      toGetProductBySlugQuery(slug, dto, lang),
    );
    return ApiResponse.of(data);
  }
}
