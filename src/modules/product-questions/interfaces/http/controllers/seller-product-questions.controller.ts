import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import SellerActiveGuard from '../../../../sellers/interfaces/http/guards/seller-active.guard';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import AnswerProductQuestionCommand from '../../../domain/application/commands/answer-product-question.command';
import AnswerProductQuestionUseCase from '../../../domain/application/usecases/answer-product-question.usecase';
import AnswerProductQuestionHttpDto from '../dto/answer-product-question.http-dto';

@ApiTags('seller-product-questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SellerActiveGuard)
@Roles(Role.RETAIL_SELLER, Role.WHOLESALE_SELLER)
@Controller('seller/product-questions')
export default class SellerProductQuestionsController {
  constructor(private readonly answerQuestion: AnswerProductQuestionUseCase) {}

  @Post(':questionId/answers')
  @ApiOperation({
    summary: 'Answer a buyer question on one of my products',
  })
  async answer(
    @CurrentUser() user: User,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: AnswerProductQuestionHttpDto,
  ) {
    const answer = await this.answerQuestion.execute(
      new AnswerProductQuestionCommand(
        questionId,
        user.getId(),
        user.getRoles(),
        dto.body,
      ),
    );
    return ApiResponse.of({
      id: answer.id,
      questionId: answer.questionId,
      body: answer.body,
      createdAt: answer.createdAt?.toISOString() ?? null,
    });
  }
}
