import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetProductImageItemHttpDto {
  @ApiPropertyOptional({
    description: 'Storage key from POST /files/upload (e.g. uploads/…jpg)',
  })
  @ValidateIf((dto: SetProductImageItemHttpDto) => !dto.url)
  @IsString()
  key?: string;

  @ApiPropertyOptional({
    description: 'Presigned or path URL containing /uploads/',
  })
  @ValidateIf((dto: SetProductImageItemHttpDto) => !dto.key)
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altFa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export default class SetProductImagesHttpDto {
  @ApiProperty({ type: [SetProductImageItemHttpDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SetProductImageItemHttpDto)
  images!: SetProductImageItemHttpDto[];
}
