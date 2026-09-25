import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import ProductQuestionKind from '../../../domain/model/enums/product-question-kind.enum';
import ProductQuestionStatus from '../../../domain/model/enums/product-question-status.enum';

export default class ListProductQuestionsQueryHttpDto {
  @ApiPropertyOptional({ enum: ProductQuestionKind })
  @IsOptional()
  @IsEnum(ProductQuestionKind)
  kind?: ProductQuestionKind;

  @ApiPropertyOptional({ enum: ProductQuestionStatus })
  @IsOptional()
  @IsEnum(ProductQuestionStatus)
  status?: ProductQuestionStatus;
}
