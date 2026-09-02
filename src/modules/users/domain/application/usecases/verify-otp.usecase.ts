import { Inject, Injectable } from '@nestjs/common';
import type OtpServicePort from '../../../../shared/application/ports/otp.service.port';
import { OTP_SERVICE } from '../../../../shared/tokens/port.tokens';
import VerifyOtpCommand from '../commands/verify-otp.command';
import AccountInactiveError from '../../errors/account-inactive.error';
import AccountNotFoundError from '../../errors/account-not-found.error';
import InvalidOtpError from '../../errors/invalid-otp.error';
import OtpExpiredError from '../../errors/otp-expired.error';
import Phone from '../../model/phone';
import User from '../../model/user.model';
import type PendingSignupRepositoryPort from '../../ports/pending-signup.repository.port';
import type UserRepositoryPort from '../../ports/user.repository.port';
import AuthSession from '../../view-models/auth-session.view-model';
import {
  PENDING_SIGNUP_REPOSITORY,
  USER_REPOSITORY,
} from '../../../shared/tokens/port.token';
import IssueSessionUseCase from './issue-session.usecase';

@Injectable()
export default class VerifyOtpUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(PENDING_SIGNUP_REPOSITORY)
    private readonly pending: PendingSignupRepositoryPort,
    @Inject(OTP_SERVICE)
    private readonly otp: OtpServicePort,
    private readonly issueSession: IssueSessionUseCase,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<AuthSession> {
    const phone = Phone.parse(command.phone).toString();
    const verified = await this.otp.verify(phone, command.code.trim());
    if (!verified.ok) {
      if (verified.reason === 'EXPIRED') {
        throw new OtpExpiredError();
      }
      throw new InvalidOtpError();
    }

    let user = await this.users.findByPhone(phone);
    if (!user) {
      const signup = await this.pending.find(phone);
      if (!signup) {
        throw new AccountNotFoundError();
      }
      user = await this.users.save(
        User.createBuyer(phone, signup.fullName),
      );
      await this.pending.delete(phone);
    } else {
      if (!user.isActive()) {
        throw new AccountInactiveError();
      }
      user.markPhoneVerified();
      user = await this.users.save(user);
      await this.pending.delete(phone);
    }

    return this.issueSession.execute(user);
  }
}
