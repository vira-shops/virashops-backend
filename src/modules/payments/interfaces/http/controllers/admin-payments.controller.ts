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
import ApproveChequePaymentCommand from '../../../domain/application/commands/approve-cheque-payment.command';
import RejectChequePaymentCommand from '../../../domain/application/commands/reject-cheque-payment.command';
import ListChequeReviewsQuery from '../../../domain/application/queries/list-cheque-reviews.query';
import ApproveChequePaymentUseCase from '../../../domain/application/usecases/approve-cheque-payment.usecase';
import ListChequeReviewsUseCase from '../../../domain/application/usecases/list-cheque-reviews.usecase';
import RejectChequePaymentUseCase from '../../../domain/application/usecases/reject-cheque-payment.usecase';
import ChequeVerificationStatus from '../../../domain/model/enums/cheque-verification-status.enum';
import ListChequeReviewsHttpDto from '../dto/list-cheque-reviews.http-dto';
import RejectChequePaymentHttpDto from '../dto/reject-cheque-payment.http-dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export default class AdminPaymentsController {
  constructor(
    private readonly listReviews: ListChequeReviewsUseCase,
    private readonly approveCheque: ApproveChequePaymentUseCase,
    private readonly rejectCheque: RejectChequePaymentUseCase,
  ) {}

  @Get('cheque-reviews')
  @ApiOperation({ summary: 'Admin: list cheque submissions for review' })
  async listChequeReviews(
    @CurrentUser() actor: User,
    @Query() query: ListChequeReviewsHttpDto,
  ) {
    const items = await this.listReviews.execute(
      new ListChequeReviewsQuery(
        actor.getRoles(),
        query.status ?? ChequeVerificationStatus.AWAITING_REVIEW,
      ),
    );
    return ApiResponse.of(items);
  }

  @Post(':id/cheque-approve')
  @ApiOperation({
    summary: 'Admin: approve cheque payment and materialize order',
  })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: User,
  ) {
    const result = await this.approveCheque.execute(
      new ApproveChequePaymentCommand(id, actor.getId(), actor.getRoles()),
    );
    return ApiResponse.of(result);
  }

  @Post(':id/cheque-reject')
  @ApiOperation({
    summary: 'Admin: reject cheque submission (buyer may resubmit)',
  })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectChequePaymentHttpDto,
    @CurrentUser() actor: User,
  ) {
    const result = await this.rejectCheque.execute(
      new RejectChequePaymentCommand(
        id,
        actor.getId(),
        actor.getRoles(),
        dto.reasons,
        dto.note ?? null,
      ),
    );
    return ApiResponse.of(result);
  }
}
