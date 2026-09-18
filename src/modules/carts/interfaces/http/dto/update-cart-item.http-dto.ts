import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export default class UpdateCartItemHttpDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  packQty!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pieceQty!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prepaymentAmount?: number;
}
