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
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import ProductQuestionKind from '../../../domain/model/enums/product-question-kind.enum';
import AskProductQuestionCommand from '../../../domain/application/commands/ask-product-question.command';
import RateProductCommand from '../../../domain/application/commands/rate-product.command';
import GetMyProductRatingQuery from '../../../domain/application/queries/get-my-product-rating.query';
import GetProductRatingSummaryQuery from '../../../domain/application/queries/get-product-rating-summary.query';
import ListMyQuestionRepliesQuery from '../../../domain/application/queries/list-my-question-replies.query';
import ListMyQuestionsQuery from '../../../domain/application/queries/list-my-questions.query';
import AskProductQuestionUseCase from '../../../domain/application/usecases/ask-product-question.usecase';
import GetMyProductRatingUseCase from '../../../domain/application/usecases/get-my-product-rating.usecase';
import GetProductRatingSummaryUseCase from '../../../domain/application/usecases/get-product-rating-summary.usecase';
import ListMyQuestionRepliesUseCase from '../../../domain/application/usecases/list-my-question-replies.usecase';
import ListMyQuestionsUseCase from '../../../domain/application/usecases/list-my-questions.usecase';
import RateProductUseCase from '../../../domain/application/usecases/rate-product.usecase';
import AskProductQuestionHttpDto from '../dto/ask-product-question.http-dto';
import ListProductQuestionsQueryHttpDto from '../dto/list-product-questions-query.http-dto';
import RateProductHttpDto from '../dto/rate-product.http-dto';

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
    private readonly rateProduct: RateProductUseCase,
    private readonly getMyProductRating: GetMyProductRatingUseCase,
    private readonly getProductRatingSummary: GetProductRatingSummaryUseCase,
  ) {}

  @Get('me/questions')
  @ApiOperation({ summary: 'My product comments/questions (نظرات شما)' })
  async myQuestions(
    @CurrentUser() user: User,
    @Query() query: ListProductQuestionsQueryHttpDto,
  ) {
    const items = await this.listMyQuestions.execute(
      new ListMyQuestionsQuery(user.getId(), query.kind ?? null),
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
  @ApiOperation({ summary: 'Post a COMMENT or QUESTION on a product' })
  async ask(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: AskProductQuestionHttpDto,
  ) {
    const question = await this.askQuestion.execute(
      new AskProductQuestionCommand(
        user.getId(),
        productId,
        dto.body,
        dto.kind ?? ProductQuestionKind.QUESTION,
      ),
    );
    return ApiResponse.of({
      id: question.getId(),
      productId: question.getProductId(),
      kind: question.getKind(),
      status: question.getStatus(),
      body: question.getBody(),
    });
  }

  @Post('products/:productId/ratings')
  @ApiOperation({ summary: 'Rate a product 1–5 (one rating per buyer)' })
  async rate(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: RateProductHttpDto,
  ) {
    const rating = await this.rateProduct.execute(
      new RateProductCommand(user.getId(), productId, dto.rating),
    );
    return ApiResponse.of({
      productId: rating.getProductId(),
      rating: rating.getRating(),
    });
  }

  @Get('products/:productId/ratings/me')
  @ApiOperation({ summary: 'My rating for a product' })
  async myRating(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const result = await this.getMyProductRating.execute(
      new GetMyProductRatingQuery(user.getId(), productId),
    );
    return ApiResponse.of(result);
  }

  @Get('products/:productId/ratings/summary')
  @ApiOperation({ summary: 'Average rating summary for a product' })
  async ratingSummary(@Param('productId', ParseIntPipe) productId: number) {
    const result = await this.getProductRatingSummary.execute(
      new GetProductRatingSummaryQuery(productId),
    );
    return ApiResponse.of(result);
  }
}
