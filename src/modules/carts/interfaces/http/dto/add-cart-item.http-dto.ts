import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import CartChannel from '../../../domain/model/enums/cart-channel.enum';

export default class AddCartItemHttpDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  packQty: number = 0;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pieceQty: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prepaymentAmount?: number;

  @ApiPropertyOptional({ enum: CartChannel, default: CartChannel.WHOLESALE })
  @IsOptional()
  @IsEnum(CartChannel)
  channel?: CartChannel;
}
