import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import type { EnvironmentVariables } from '../../../../../config/env.validation';
import RequireIdempotency from '../../../../shared/interface/http/decorators/require-idempotency.decorator';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import InitiatePaymentCommand from '../../../domain/application/commands/initiate-payment.command';
import MarkPaymentPaidCommand from '../../../domain/application/commands/mark-payment-paid.command';
import SubmitChequeVerificationCommand from '../../../domain/application/commands/submit-cheque-verification.command';
import ValidateBankAccountCommand from '../../../domain/application/commands/validate-bank-account.command';
import GetChequeSubmissionQuery from '../../../domain/application/queries/get-cheque-submission.query';
import GetLatestBankAccountValidationQuery from '../../../domain/application/queries/get-latest-bank-account-validation.query';
import PaymentMethodRegistry from '../../../domain/application/services/payment-method.registry';
import GetChequeSubmissionUseCase from '../../../domain/application/usecases/get-cheque-submission.usecase';
import GetLatestBankAccountValidationUseCase from '../../../domain/application/usecases/get-latest-bank-account-validation.usecase';
import InitiatePaymentUseCase from '../../../domain/application/usecases/initiate-payment.usecase';
import MarkPaymentPaidUseCase from '../../../domain/application/usecases/mark-payment-paid.usecase';
import SubmitChequeVerificationUseCase from '../../../domain/application/usecases/submit-cheque-verification.usecase';
import ValidateBankAccountUseCase from '../../../domain/application/usecases/validate-bank-account.usecase';
import PaymentMethodName from '../../../domain/model/enums/payment-method.enum';
import InitiatePaymentHttpDto from '../dto/initiate-payment.http-dto';
import SubmitChequeVerificationHttpDto from '../dto/submit-cheque-verification.http-dto';
import ValidateBankAccountHttpDto from '../dto/validate-bank-account.http-dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_BUYER, Role.WHOLESALE_BUYER)
@Controller('payments')
export default class PaymentsController {
  constructor(
    private readonly initiatePayment: InitiatePaymentUseCase,
    private readonly markPaymentPaid: MarkPaymentPaidUseCase,
    private readonly submitCheque: SubmitChequeVerificationUseCase,
    private readonly getChequeSubmission: GetChequeSubmissionUseCase,
    private readonly validateBankAccount: ValidateBankAccountUseCase,
    private readonly getLatestBankAccountValidation: GetLatestBankAccountValidationUseCase,
    private readonly methods: PaymentMethodRegistry,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Get('methods')
  @ApiOperation({ summary: 'List available payment methods' })
  listMethods() {
    const payee = {
      name: this.config.get('CHEQUE_PAYEE_NAME', { infer: true }),
      nationalId: this.config.get('CHEQUE_PAYEE_NATIONAL_ID', { infer: true }),
    };
    const mailing = {
      address: this.config.get('CHEQUE_MAILING_ADDRESS', { infer: true }),
      postalCode: this.config.get('CHEQUE_MAILING_POSTAL_CODE', {
        infer: true,
      }),
    };
    return ApiResponse.of(
      this.methods.listAvailable('WHOLESALE').map((method) => ({
        name: method.name,
        psp: method.psp ?? null,
        ...(method.name === PaymentMethodName.CHEQUE ? { payee, mailing } : {}),
      })),
    );
  }

  @Post('bank-account-validations')
  @ApiOperation({
    summary:
      'Validate bank account / identity (stub credit inquiry) before CHEQUE',
  })
  async createBankAccountValidation(
    @CurrentUser() user: User,
    @Body() dto: ValidateBankAccountHttpDto,
  ) {
    const result = await this.validateBankAccount.execute(
      new ValidateBankAccountCommand(
        user.getId(),
        dto.fullName,
        dto.accountNumber,
        dto.nationalId,
        dto.branchCode,
      ),
    );
    return ApiResponse.created(result);
  }

  @Get('bank-account-validations/latest')
  @ApiOperation({
    summary: 'Latest non-expired SUCCEEDED bank account validation',
  })
  async latestBankAccountValidation(@CurrentUser() user: User) {
    const result = await this.getLatestBankAccountValidation.execute(
      new GetLatestBankAccountValidationQuery(user.getId()),
    );
    return ApiResponse.of(result);
  }

  @Post('initiate')
  @RequireIdempotency()
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Initiate payment for a checkout session' })
  async initiate(
    @CurrentUser() user: User,
    @Body() dto: InitiatePaymentHttpDto,
  ) {
    const result = await this.initiatePayment.execute(
      new InitiatePaymentCommand(
        user.getId(),
        dto.checkoutSessionId,
        dto.method,
        dto.callbackUrl,
      ),
    );
    return ApiResponse.created({
      id: result.paymentId,
      ...result,
    });
  }

  @Post(':id/mark-paid')
  @ApiOperation({
    summary: 'Stub: mark ONLINE payment paid and materialize order',
  })
  async markPaid(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.markPaymentPaid.execute(
      new MarkPaymentPaidCommand(user.getId(), id),
    );
    return ApiResponse.of(result);
  }

  @Post(':id/cheque-submission')
  @ApiOperation({
    summary: 'Submit cheque verification documents for admin review',
  })
  async submitChequeVerification(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitChequeVerificationHttpDto,
  ) {
    const result = await this.submitCheque.execute(
      new SubmitChequeVerificationCommand(
        user.getId(),
        id,
        dto.fullName,
        dto.accountNumber,
        dto.nationalId,
        dto.branchCode,
        dto.chequePhotos,
        dto.cadence ?? null,
        dto.downPayment ?? null,
        dto.planItems ?? [],
      ),
    );
    return ApiResponse.of(result);
  }

  @Get(':id/cheque-submission')
  @ApiOperation({ summary: 'Get cheque submission status for a payment' })
  async getChequeVerification(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.getChequeSubmission.execute(
      new GetChequeSubmissionQuery(user.getId(), id),
    );
    return ApiResponse.of(result);
  }
}
