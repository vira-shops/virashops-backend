import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export default class AnswerProductQuestionHttpDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  body!: string;
}
