import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt } from 'class-validator';
import ShippingMethodName from '../../../domain/model/enums/shipping-method.enum';

export default class QuoteShippingHttpDto {
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
  method!: ShippingMethodName;
}
