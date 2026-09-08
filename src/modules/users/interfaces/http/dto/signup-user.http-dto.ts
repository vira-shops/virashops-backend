import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import AccountType from '../../../domain/model/enums/account-type.enum';
import Channel from '../../../domain/model/enums/channel.enum';

const emptyToNull = ({ value }: { value: unknown }) =>
  value === '' || value === undefined ? null : value;

export default class SignupUserHttpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ example: '09123456789' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ enum: Channel })
  @IsEnum(Channel)
  channel: Channel;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  activityType: string;

  @ApiPropertyOptional()
  @Transform(emptyToNull)
  @ValidateIf((dto: SignupUserHttpDto) => dto.accountType === AccountType.BUYER)
  @IsString()
  @IsNotEmpty()
  guildType?: string | null;

  @ApiPropertyOptional()
  @Transform(emptyToNull)
  @ValidateIf(
    (dto: SignupUserHttpDto) =>
      dto.accountType === AccountType.SELLER ||
      dto.accountType === AccountType.BOTH,
  )
  @IsString()
  @IsNotEmpty()
  industryType?: string | null;

  @ApiPropertyOptional()
  @Transform(emptyToNull)
  @ValidateIf(
    (dto: SignupUserHttpDto) =>
      dto.accountType === AccountType.SELLER ||
      dto.accountType === AccountType.BOTH,
  )
  @IsString()
  @IsNotEmpty()
  category?: string | null;

  @ApiPropertyOptional({
    description: 'Required for seller/both. Buyer uses activityType instead.',
  })
  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  documentType?: string | null;
}
