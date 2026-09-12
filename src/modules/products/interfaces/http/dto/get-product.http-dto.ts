import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import CatalogChannel from '../../../domain/model/enums/catalog-channel.enum';

export default class GetProductHttpDto {
  @ApiPropertyOptional({ enum: CatalogChannel, default: CatalogChannel.RETAIL })
  @IsOptional()
  @IsEnum(CatalogChannel)
  channel?: CatalogChannel;
}
