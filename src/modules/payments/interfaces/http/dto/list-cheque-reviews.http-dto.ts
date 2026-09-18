import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import ChequeVerificationStatus from '../../../domain/model/enums/cheque-verification-status.enum';

export default class ListChequeReviewsHttpDto {
  @ApiPropertyOptional({ enum: ChequeVerificationStatus })
  @IsOptional()
  @IsEnum(ChequeVerificationStatus)
  status?: ChequeVerificationStatus;
}
