import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import LogoutCommand from '../../../domain/application/commands/logout.command';
import RequestOtpCommand from '../../../domain/application/commands/request-otp.command';
import SignupUserCommand from '../../../domain/application/commands/signup-user.command';
import VerifyOtpCommand from '../../../domain/application/commands/verify-otp.command';
import GetMeQuery from '../../../domain/application/queries/get-me.query';
import GetMeUseCase from '../../../domain/application/usecases/get-me.usecase';
import LogoutUseCase from '../../../domain/application/usecases/logout.usecase';
import RequestOtpUseCase from '../../../domain/application/usecases/request-otp.usecase';
import SignupUserUseCase from '../../../domain/application/usecases/signup-user.usecase';
import VerifyOtpUseCase from '../../../domain/application/usecases/verify-otp.usecase';
import UnauthorizedError from '../../../domain/errors/unauthorized.error';
import User from '../../../domain/model/user.model';
import CurrentUser from '../decorators/current-user.decorator';
import RequestOtpHttpDto from '../dto/request-otp.http-dto';
import SignupUserHttpDto from '../dto/signup-user.http-dto';
import VerifyOtpHttpDto from '../dto/verify-otp.http-dto';
import JwtAuthGuard from '../guards/jwt-auth.guard';
import AuthHttpMapper from '../mappers/auth-http.mapper';

@ApiTags('auth')
@Controller('auth')
export default class AuthController {
  constructor(
    private readonly signupUser: SignupUserUseCase,
    private readonly requestOtp: RequestOtpUseCase,
    private readonly verifyOtp: VerifyOtpUseCase,
    private readonly logout: LogoutUseCase,
    private readonly getMe: GetMeUseCase,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buyer signup: name + mobile, then OTP' })
  async signup(@Body() dto: SignupUserHttpDto) {
    const data = await this.signupUser.execute(
      new SignupUserCommand(dto.fullName, dto.phone),
    );
    return ApiResponse.of(data);
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request login OTP for an existing account' })
  async requestLoginOtp(@Body() dto: RequestOtpHttpDto) {
    const data = await this.requestOtp.execute(new RequestOtpCommand(dto.phone));
    return ApiResponse.of(data);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and receive a JWT' })
  async verify(@Body() dto: VerifyOtpHttpDto) {
    const session = await this.verifyOtp.execute(
      new VerifyOtpCommand(dto.phone, dto.code),
    );
    return ApiResponse.of(AuthHttpMapper.toSession(session));
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
