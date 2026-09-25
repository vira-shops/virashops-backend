import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import GetSellerByUserIdQuery from '../../../../sellers/domain/application/queries/get-seller-by-user-id.query';
import GetSellerByUserIdUseCase from '../../../../sellers/domain/application/usecases/get-seller-by-user-id.usecase';
import SellerNotFoundError from '../../../../sellers/domain/errors/seller-not-found.error';
import SellerActiveGuard from '../../../../sellers/interfaces/http/guards/seller-active.guard';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import AnswerProductQuestionCommand from '../../../domain/application/commands/answer-product-question.command';
import ConfirmProductQuestionCommand from '../../../domain/application/commands/confirm-product-question.command';
import ListSellerProductQuestionsQuery from '../../../domain/application/queries/list-seller-product-questions.query';
import AnswerProductQuestionUseCase from '../../../domain/application/usecases/answer-product-question.usecase';
import ConfirmProductQuestionUseCase from '../../../domain/application/usecases/confirm-product-question.usecase';
import ListSellerProductQuestionsUseCase from '../../../domain/application/usecases/list-seller-product-questions.usecase';
import AnswerProductQuestionHttpDto from '../dto/answer-product-question.http-dto';
import ListProductQuestionsQueryHttpDto from '../dto/list-product-questions-query.http-dto';

@ApiTags('seller-product-questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SellerActiveGuard)
@Roles(Role.WHOLESALE_SELLER, Role.RETAIL_SELLER)
@Controller('seller/product-questions')
export default class SellerProductQuestionsController {
  constructor(
    private readonly answerQuestion: AnswerProductQuestionUseCase,
    private readonly confirmQuestion: ConfirmProductQuestionUseCase,
    private readonly listQuestions: ListSellerProductQuestionsUseCase,
    private readonly getSellerByUserId: GetSellerByUserIdUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List COMMENT/QUESTION items on my products (filter by kind/status)',
  })
  async list(
    @CurrentUser() user: User,
    @Query() query: ListProductQuestionsQueryHttpDto,
  ) {
    const seller = await this.getSellerByUserId.execute(
      new GetSellerByUserIdQuery(user.getId()),
    );
    if (!seller) {
      throw new SellerNotFoundError();
    }
    const items = await this.listQuestions.execute(
      new ListSellerProductQuestionsQuery(
        seller.id,
        query.kind ?? null,
        query.status ?? null,
      ),
    );
    return ApiResponse.of(items);
  }

  @Post(':questionId/confirm')
  @ApiOperation({
    summary: 'Confirm a COMMENT or QUESTION (NOT_CONFIRMED → CONFIRMED)',
  })
  async confirm(
    @CurrentUser() user: User,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    const question = await this.confirmQuestion.execute(
      new ConfirmProductQuestionCommand(
        questionId,
        user.getId(),
        user.getRoles(),
      ),
    );
    return ApiResponse.of({
      id: question.getId(),
      kind: question.getKind(),
      status: question.getStatus(),
    });
  }

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
