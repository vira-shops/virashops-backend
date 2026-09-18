import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export default class ValidateBankAccountHttpDto {
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
  @MinLength(2)
  branchCode!: string;
}
