import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import AskProductQuestionCommand from '../../../domain/application/commands/ask-product-question.command';
import ListMyQuestionRepliesQuery from '../../../domain/application/queries/list-my-question-replies.query';
import ListMyQuestionsQuery from '../../../domain/application/queries/list-my-questions.query';
import AskProductQuestionUseCase from '../../../domain/application/usecases/ask-product-question.usecase';
import ListMyQuestionRepliesUseCase from '../../../domain/application/usecases/list-my-question-replies.usecase';
import ListMyQuestionsUseCase from '../../../domain/application/usecases/list-my-questions.usecase';
import AskProductQuestionHttpDto from '../dto/ask-product-question.http-dto';

@ApiTags('product-questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_BUYER, Role.WHOLESALE_BUYER)
@Controller()
export default class ProductQuestionsController {
  constructor(
    private readonly askQuestion: AskProductQuestionUseCase,
    private readonly listMyQuestions: ListMyQuestionsUseCase,
    private readonly listMyReplies: ListMyQuestionRepliesUseCase,
  ) {}

  @Get('me/questions')
  @ApiOperation({ summary: 'My product questions (نظرات شما)' })
  async myQuestions(@CurrentUser() user: User) {
    const items = await this.listMyQuestions.execute(
      new ListMyQuestionsQuery(user.getId()),
    );
    return ApiResponse.of(items);
  }

  @Get('me/question-replies')
  @ApiOperation({ summary: 'Replies to my questions (پاسخ‌ها)' })
  async myReplies(@CurrentUser() user: User) {
    const result = await this.listMyReplies.execute(
      new ListMyQuestionRepliesQuery(user.getId()),
    );
    return ApiResponse.of(result);
  }

  @Post('products/:productId/questions')
  @ApiOperation({ summary: 'Ask a question about a product' })
  async ask(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: AskProductQuestionHttpDto,
  ) {
    const question = await this.askQuestion.execute(
      new AskProductQuestionCommand(user.getId(), productId, dto.body),
    );
    return ApiResponse.of({
      id: question.getId(),
      productId: question.getProductId(),
      body: question.getBody(),
    });
  }
}
