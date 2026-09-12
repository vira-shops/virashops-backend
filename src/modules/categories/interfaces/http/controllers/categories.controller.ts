import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import ApiResponse from '../../../../../common/http/api-response';
import GetCategoryBySlugQuery from '../../../domain/application/queries/get-category-by-slug.query';
import GetCategoryTreeQuery from '../../../domain/application/queries/get-category-tree.query';
import GetHomeCategoriesQuery from '../../../domain/application/queries/get-home-categories.query';
import GetCategoryBySlugUseCase from '../../../domain/application/usecases/get-category-by-slug.usecase';
import GetCategoryTreeUseCase from '../../../domain/application/usecases/get-category-tree.usecase';
import GetHomeCategoriesUseCase from '../../../domain/application/usecases/get-home-categories.usecase';
import { requestLang } from '../mappers/category-http.mapper';

@ApiTags('categories')
@Controller('categories')
export default class CategoriesController {
  constructor(
    private readonly getTree: GetCategoryTreeUseCase,
    private readonly getHome: GetHomeCategoriesUseCase,
    private readonly getBySlug: GetCategoryBySlugUseCase,
  ) {}

  @Get('tree')
  @ApiOperation({ summary: 'Category mega-menu tree (3 levels)' })
  async tree(@I18nLang() lang: string) {
    const data = await this.getTree.execute(
      new GetCategoryTreeQuery(requestLang(lang)),
    );
    return ApiResponse.of(data);
  }

  @Get('home')
  @ApiOperation({ summary: 'Homepage shortcuts and featured category grid' })
  async home(@I18nLang() lang: string) {
    const data = await this.getHome.execute(
      new GetHomeCategoriesQuery(requestLang(lang)),
    );
    return ApiResponse.of(data);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Category by slug with breadcrumb and children' })
  async bySlug(@Param('slug') slug: string, @I18nLang() lang: string) {
    const data = await this.getBySlug.execute(
      new GetCategoryBySlugQuery(slug, requestLang(lang)),
    );
    return ApiResponse.of(data);
  }
}
