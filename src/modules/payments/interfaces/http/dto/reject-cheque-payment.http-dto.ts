import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import ChequeRejectionReason from '../../../domain/model/enums/cheque-rejection-reason.enum';

export default class RejectChequePaymentHttpDto {
  @ApiProperty({
    enum: ChequeRejectionReason,
    isArray: true,
    example: [ChequeRejectionReason.IMAGE_QUALITY],
    description:
      'Structured fail-modal reasons (Sayad mismatch / non-payment / image quality)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(ChequeRejectionReason, { each: true })
  reasons!: ChequeRejectionReason[];

  @ApiPropertyOptional({ example: 'Blurry corners on cheque 2' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  note?: string;
}
