import { Inject, Injectable, Optional } from '@nestjs/common';
import type OtpServicePort from '../../../../shared/application/ports/otp.service.port';
import { OTP_SERVICE } from '../../../../shared/tokens/port.tokens';
import VerifyOtpCommand from '../commands/verify-otp.command';
import AccountInactiveError from '../../errors/account-inactive.error';
import AccountNotFoundError from '../../errors/account-not-found.error';
import InvalidOtpError from '../../errors/invalid-otp.error';
import InvalidSignupFieldError from '../../errors/invalid-signup-field.error';
import OtpExpiredError from '../../errors/otp-expired.error';
import Phone from '../../model/phone';
import rolesFromSignup, {
  isSellerAccountType,
  sellerKindFromSignup,
} from '../../model/roles-from-signup';
import User from '../../model/user.model';
import type CreatePendingSellerPort from '../../ports/create-pending-seller.port';
import type PendingSignupRepositoryPort from '../../ports/pending-signup.repository.port';
import type UserRepositoryPort from '../../ports/user.repository.port';
import {
  AuthOrStep2,
  SignupStep2Required,
} from '../../view-models/auth-session.view-model';
import {
  CREATE_PENDING_SELLER,
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
    @Optional()
    @Inject(CREATE_PENDING_SELLER)
    private readonly createSeller?: CreatePendingSellerPort,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<AuthOrStep2> {
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

      if (signup.step === 1) {
        await this.pending.save(phone, {
          ...signup,
          step: 2,
        });
        return new SignupStep2Required(
          phone,
          signup.firstName,
          signup.lastName,
        );
      }

      if (!signup.channel || !signup.accountType) {
        throw new InvalidSignupFieldError('Step 2 data is incomplete');
      }

      user = await this.users.save(
        User.createFromSignup({
          phone,
          firstName: signup.firstName,
          lastName: signup.lastName,
          roles: rolesFromSignup(signup.channel, signup.accountType),
          activityType: signup.activityType || null,
          guildType: signup.guildType || null,
        }),
      );

      if (isSellerAccountType(signup.accountType)) {
        const kind = sellerKindFromSignup(signup.channel, signup.accountType);
        if (
          !kind ||
          !signup.industryType ||
          !signup.category ||
          !signup.activityType ||
          !signup.documentKey
        ) {
          throw new InvalidSignupFieldError('Seller signup data is incomplete');
        }
        if (!this.createSeller) {
          throw new InvalidSignupFieldError('Seller signup is not available');
        }
        await this.createSeller.create({
          userId: user.getId(),
          kind,
          industryType: signup.industryType,
          category: signup.category,
          activityType: signup.activityType,
          documentType: signup.documentType ?? 'BUSINESS_LICENSE',
          documentKey: signup.documentKey,
        });
      }

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
