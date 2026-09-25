import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export default class UpsertAddressHttpDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  province!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @ApiProperty({ description: 'Receiver full name' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  recipientFullName!: string;

  @ApiProperty({ description: 'Receiver mobile (11 digits)' })
  @IsString()
  @Matches(/^\d{11}$/)
  recipientPhone!: string;

  @ApiProperty({ description: 'National ID (10 digits)' })
  @IsString()
  @Matches(/^\d{10}$/)
  nationalId!: string;

  @ApiProperty({ description: 'House / plaque number' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  houseNumber!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
