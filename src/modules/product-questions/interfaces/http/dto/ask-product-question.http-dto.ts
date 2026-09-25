import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import ProductQuestionKind from '../../../domain/model/enums/product-question-kind.enum';

export default class AskProductQuestionHttpDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  body!: string;

  @ApiPropertyOptional({
    enum: ProductQuestionKind,
    default: ProductQuestionKind.QUESTION,
  })
  @IsOptional()
  @IsEnum(ProductQuestionKind)
  kind?: ProductQuestionKind;
}
