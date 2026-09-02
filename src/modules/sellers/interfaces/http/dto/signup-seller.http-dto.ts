import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import SalesType from '../../../domain/model/enums/sales-type.enum';
import SellerDocumentType from '../../../domain/model/enums/seller-document-type.enum';
import SellerKind from '../../../domain/model/enums/seller-kind.enum';

const emptyToNull = ({ value }: { value: unknown }) =>
  value === '' || value === undefined ? null : value;

export default class SignupSellerHttpDto {
  @ApiProperty({ enum: SellerKind })
  @IsEnum(SellerKind)
  kind: SellerKind;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: '09123456789' })
  @IsString()
  @IsNotEmpty()
  phone: string;

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

  @ApiProperty({ enum: SellerDocumentType })
  @IsEnum(SellerDocumentType)
  documentType: SellerDocumentType;
}
