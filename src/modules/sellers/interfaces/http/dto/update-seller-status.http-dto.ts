import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import SellerStatus from '../../../domain/model/enums/seller-status.enum';

export default class UpdateSellerStatusHttpDto {
  @ApiProperty({ enum: SellerStatus })
  @IsEnum(SellerStatus)
  status: SellerStatus;
}
