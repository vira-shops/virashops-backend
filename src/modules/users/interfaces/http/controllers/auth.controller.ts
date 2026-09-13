import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import ApiResponse from '../../../../../common/http/api-response';
import LogoutCommand from '../../../domain/application/commands/logout.command';
import RequestOtpCommand from '../../../domain/application/commands/request-otp.command';
import SignupUserCommand from '../../../domain/application/commands/signup-user.command';
import {
  SignupStep1Command,
  SignupStep2Command,
} from '../../../domain/application/commands/signup-user.command';
import VerifyOtpCommand from '../../../domain/application/commands/verify-otp.command';
import GetMeQuery from '../../../domain/application/queries/get-me.query';
import GetMeUseCase from '../../../domain/application/usecases/get-me.usecase';
import LogoutUseCase from '../../../domain/application/usecases/logout.usecase';
import RequestOtpUseCase from '../../../domain/application/usecases/request-otp.usecase';
import SignupUserUseCase from '../../../domain/application/usecases/signup-user.usecase';
import SignupStep1UseCase from '../../../domain/application/usecases/signup-step1.usecase';
import SignupStep2UseCase from '../../../domain/application/usecases/signup-step2.usecase';
import VerifyOtpUseCase from '../../../domain/application/usecases/verify-otp.usecase';
import UnauthorizedError from '../../../domain/errors/unauthorized.error';
import User from '../../../domain/model/user.model';
import CurrentUser from '../decorators/current-user.decorator';
import RequestOtpHttpDto from '../dto/request-otp.http-dto';
import SignupStep1HttpDto from '../dto/signup-step1.http-dto';
import SignupStep2HttpDto from '../dto/signup-step2.http-dto';
import SignupUserHttpDto from '../dto/signup-user.http-dto';
import VerifyOtpHttpDto from '../dto/verify-otp.http-dto';
import JwtAuthGuard from '../guards/jwt-auth.guard';
import AuthHttpMapper from '../mappers/auth-http.mapper';

@ApiTags('auth')
@Controller('auth')
export default class AuthController {
  constructor(
    private readonly signupUser: SignupUserUseCase,
    private readonly step1Service: SignupStep1UseCase,
    private readonly step2Service: SignupStep2UseCase,
    private readonly requestOtp: RequestOtpUseCase,
    private readonly verifyOtp: VerifyOtpUseCase,
    private readonly logout: LogoutUseCase,
    private readonly getMe: GetMeUseCase,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('document', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Signup (buyer/seller/both). Sends a 6-digit OTP; no JWT yet',
    deprecated: true,
  })
  async signup(
    @Body() dto: SignupUserHttpDto,
    @UploadedFile()
    file?: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const data = await this.signupUser.execute(
      new SignupUserCommand(
        dto.firstName,
        dto.lastName,
        dto.phone,
        dto.channel,
        dto.accountType,
        dto.activityType ?? null,
        dto.guildType ?? null,
        dto.industryType ?? null,
        dto.category ?? dto.activityType ?? null,
        dto.documentType ?? null,
        file
          ? {
              buffer: file.buffer,
              mimeType: file.mimetype,
              originalName: file.originalname,
            }
          : null,
      ),
    );
    return ApiResponse.of(data);
  }

  @Post('signup/step1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Signup Step 1: Submit firstName, lastName, phone. Sends OTP.',
  })
  async step1Signup(@Body() dto: SignupStep1HttpDto) {
    const data = await this.step1Service.execute(
      new SignupStep1Command(dto.firstName, dto.lastName, dto.phone),
    );
    return ApiResponse.of(data);
  }

  @Post('signup/step2')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('document', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary:
      'Signup Step 2: Submit account details after OTP verification. Returns JWT.',
  })
  async step2Signup(
    @Body() dto: SignupStep2HttpDto,
    @UploadedFile()
    file?: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const session = await this.step2Service.execute(
      new SignupStep2Command(
        dto.phone,
        dto.channel,
        dto.accountType,
        dto.activityType ?? null,
        dto.guildType ?? null,
        dto.industryType ?? null,
        dto.category ?? null,
        dto.documentType ?? null,
        file
          ? {
              buffer: file.buffer,
              mimeType: file.mimetype,
              originalName: file.originalname,
            }
          : null,
      ),
    );
    return ApiResponse.of(AuthHttpMapper.toSession(session));
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request login or signup-resend OTP' })
  async requestLoginOtp(@Body() dto: RequestOtpHttpDto) {
    const data = await this.requestOtp.execute(
      new RequestOtpCommand(dto.phone),
    );
    return ApiResponse.of(data);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify 6-digit OTP. Returns JWT or indicates Step 2 is required.',
  })
  async verify(@Body() dto: VerifyOtpHttpDto) {
    const result = await this.verifyOtp.execute(
      new VerifyOtpCommand(dto.phone, dto.code),
    );
    return ApiResponse.of(AuthHttpMapper.toVerifyOtpResponse(result));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate the current session' })
  async logoutSession(@Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : null;
    if (!token) {
      throw new UnauthorizedError();
    }
    await this.logout.execute(new LogoutCommand(token));
    return ApiResponse.of({ loggedOut: true });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user profile and seller status' })
  async me(@CurrentUser() user: User) {
    const me = await this.getMe.execute(new GetMeQuery(user.getId()));
    return ApiResponse.of(AuthHttpMapper.toUser(me.user, me.seller));
  }
}
