import { Inject, Injectable } from '@nestjs/common';
import type OtpServicePort from '../../../../shared/application/ports/otp.service.port';
import type SmsServicePort from '../../../../shared/application/ports/sms.service.port';
import { OTP_SERVICE, SMS_SERVICE } from '../../../../shared/tokens/port.tokens';
import RequestOtpCommand from '../commands/request-otp.command';
import AccountInactiveError from '../../errors/account-inactive.error';
import AccountNotFoundError from '../../errors/account-not-found.error';
import OtpRateLimitedError from '../../errors/otp-rate-limited.error';
import Phone from '../../model/phone';
import type UserRepositoryPort from '../../ports/user.repository.port';
import { USER_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class RequestOtpUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(OTP_SERVICE)
    private readonly otp: OtpServicePort,
    @Inject(SMS_SERVICE)
    private readonly sms: SmsServicePort,
  ) {}

  async execute(command: RequestOtpCommand): Promise<{ otpSent: true }> {
    const phone = Phone.parse(command.phone).toString();
    const user = await this.users.findByPhone(phone);
    if (!user) {
      throw new AccountNotFoundError();
    }
    if (!user.isActive()) {
      throw new AccountInactiveError();
    }

    const issued = await this.otp.issue(phone);
    if (!issued.ok) {
      throw new OtpRateLimitedError();
    }

    await this.sms.send(phone, `Virashops code: ${issued.code}`);
    return { otpSent: true };
  }
}
