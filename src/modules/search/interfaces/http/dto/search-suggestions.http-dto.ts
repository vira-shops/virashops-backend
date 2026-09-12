import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export default class SearchSuggestionsHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['RETAIL', 'WHOLESALE'] })
  @IsOptional()
  @IsString()
  channel?: string;
}
