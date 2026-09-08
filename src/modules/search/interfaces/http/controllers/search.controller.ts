import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import ApiResponse from '../../../../../common/http/api-response';
import { requestLang } from '../../../../categories/interfaces/http/mappers/category-http.mapper';
import { toSearchCatalogQuery } from '../mappers/search-http.mapper';
import SuggestSearchQuery from '../../../domain/application/queries/suggest-search.query';
import SearchCatalogUseCase from '../../../domain/application/usecases/search-catalog.usecase';
import SuggestSearchUseCase from '../../../domain/application/usecases/suggest-search.usecase';
import SearchCatalogHttpDto from '../dto/search-catalog.http-dto';
import SearchSuggestionsHttpDto from '../dto/search-suggestions.http-dto';

@ApiTags('search')
@Controller('search')
export default class SearchController {
  constructor(
    private readonly suggest: SuggestSearchUseCase,
    private readonly search: SearchCatalogUseCase,
  ) {}

  @Get('suggestions')
  @ApiOperation({
    summary: 'Search overlay suggestions (categories + product names)',
  })
  async suggestions(
    @Query() dto: SearchSuggestionsHttpDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.suggest.execute(
      new SuggestSearchQuery(dto.q ?? '', requestLang(lang)),
    );
    return ApiResponse.of(data);
  }

  @Get()
  @ApiOperation({
    summary: 'Catalog search over published products and categories',
  })
  async catalog(@Query() dto: SearchCatalogHttpDto, @I18nLang() lang: string) {
    const data = await this.search.execute(
      toSearchCatalogQuery(dto, requestLang(lang)),
    );
    return ApiResponse.of(data);
  }
}
