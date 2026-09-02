import { Inject, Injectable } from '@nestjs/common';
import type OtpServicePort from '../../../../shared/application/ports/otp.service.port';
import type SmsServicePort from '../../../../shared/application/ports/sms.service.port';
import { OTP_SERVICE, SMS_SERVICE } from '../../../../shared/tokens/port.tokens';
import SignupUserCommand from '../commands/signup-user.command';
import PhoneAlreadyRegisteredError from '../../errors/phone-already-registered.error';
import OtpRateLimitedError from '../../errors/otp-rate-limited.error';
import Phone from '../../model/phone';
import type PendingSignupRepositoryPort from '../../ports/pending-signup.repository.port';
import type UserRepositoryPort from '../../ports/user.repository.port';
import {
  PENDING_SIGNUP_REPOSITORY,
  USER_REPOSITORY,
} from '../../../shared/tokens/port.token';

@Injectable()
export default class SignupUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(PENDING_SIGNUP_REPOSITORY)
    private readonly pending: PendingSignupRepositoryPort,
    @Inject(OTP_SERVICE)
    private readonly otp: OtpServicePort,
    @Inject(SMS_SERVICE)
    private readonly sms: SmsServicePort,
  ) {}

  async execute(command: SignupUserCommand): Promise<{ otpSent: true }> {
    const phone = Phone.parse(command.phone).toString();
    const fullName = command.fullName.trim();

    const existing = await this.users.findByPhone(phone);
    if (existing) {
      throw new PhoneAlreadyRegisteredError();
    }

    const issued = await this.otp.issue(phone);
    if (!issued.ok) {
      throw new OtpRateLimitedError();
    }

    await this.pending.save(phone, fullName);
    await this.sms.send(phone, `Virashops code: ${issued.code}`);

    return { otpSent: true };
  }
}
