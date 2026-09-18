import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import ShippingMethodName from '../../../../shipping/domain/model/enums/shipping-method.enum';

export default class StartCheckoutHttpDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  sellerId!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  addressId!: number;

  @ApiProperty({ enum: ShippingMethodName })
  @IsEnum(ShippingMethodName)
  shippingMethod!: ShippingMethodName;

  @ApiProperty({ example: '2026-09-20' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  deliveryDate!: string;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  windowStartHour!: number;

  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  windowEndHour!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
