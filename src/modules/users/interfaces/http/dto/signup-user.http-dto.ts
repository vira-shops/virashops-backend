import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export default class SignupUserHttpDto {
  @ApiProperty({ example: 'Ali Rezaei' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: '09123456789' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
