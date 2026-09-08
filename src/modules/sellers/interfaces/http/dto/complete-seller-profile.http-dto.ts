import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import SalesType from '../../../domain/model/enums/sales-type.enum';

const emptyToNull = ({ value }: { value: unknown }) =>
  value === '' || value === undefined ? null : value;

export default class CompleteSellerProfileHttpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  shopName: string;

  @ApiPropertyOptional({ example: '02123456789' })
  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  workplacePhone?: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  postalCode?: string | null;

  @ApiProperty({ enum: SalesType })
  @IsEnum(SalesType)
  salesType: SalesType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;
}
