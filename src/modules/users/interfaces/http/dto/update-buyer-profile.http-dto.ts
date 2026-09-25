import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import BuyerGender from '../../../domain/model/enums/buyer-gender.enum';
import BuyerIdentityType from '../../../domain/model/enums/buyer-identity-type.enum';

export default class UpdateBuyerProfileHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ description: 'National ID (10 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/)
  nationalId?: string | null;

  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ enum: BuyerGender })
  @IsOptional()
  @IsEnum(BuyerGender)
  gender?: BuyerGender | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatarKey?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  businessName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  businessPhone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  province?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({
    enum: BuyerIdentityType,
    description: 'KIOSK (دکه) | SUPERMARKET | STORE',
  })
  @IsOptional()
  @IsEnum(BuyerIdentityType)
  identityType?: BuyerIdentityType | null;

  @ApiPropertyOptional({
    description: 'Storage key from POST /files/upload (national ID / license)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  documentKey1?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  documentKey2?: string | null;
}
