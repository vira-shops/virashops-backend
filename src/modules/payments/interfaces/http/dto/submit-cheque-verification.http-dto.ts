import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import ChequeCadence from '../../../domain/model/enums/cheque-cadence.enum';

class ChequePlanItemHttpDto {
  @ApiProperty({ example: '2026-10-01' })
  @IsString()
  @MinLength(10)
  dueDate!: string;

  @ApiProperty({ example: 2540000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;
}

export default class SubmitChequeVerificationHttpDto {
  @ApiProperty({ example: 'علی رضایی' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @MinLength(4)
  accountNumber!: string;

  @ApiProperty({ example: '0013542419' })
  @IsString()
  @MinLength(10)
  nationalId!: string;

  @ApiProperty({ example: '2574' })
  @IsString()
  @MinLength(1)
  branchCode!: string;

  @ApiProperty({
    type: [String],
    description: 'Storage keys or URLs from POST /files/upload',
    example: ['uploads/cheque-1.jpg'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  chequePhotos!: string[];

  @ApiPropertyOptional({ enum: ChequeCadence })
  @IsOptional()
  @IsEnum(ChequeCadence)
  cadence?: ChequeCadence;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  downPayment?: number;

  @ApiPropertyOptional({ type: [ChequePlanItemHttpDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChequePlanItemHttpDto)
  planItems?: ChequePlanItemHttpDto[];
}
