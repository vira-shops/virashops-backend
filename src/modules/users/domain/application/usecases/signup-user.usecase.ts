import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';
import type OtpServicePort from '../../../../shared/application/ports/otp.service.port';
import type SmsServicePort from '../../../../shared/application/ports/sms.service.port';
import {
  FILE_STORAGE_SERVICE,
  OTP_SERVICE,
  SMS_SERVICE,
} from '../../../../shared/tokens/port.tokens';
import SignupUserCommand from '../commands/signup-user.command';
import InvalidSignupFieldError from '../../errors/invalid-signup-field.error';
import PhoneAlreadyRegisteredError from '../../errors/phone-already-registered.error';
import OtpRateLimitedError from '../../errors/otp-rate-limited.error';
import AccountType from '../../model/enums/account-type.enum';
import Phone from '../../model/phone';
import { isSellerAccountType } from '../../model/roles-from-signup';
import type PendingSignupRepositoryPort from '../../ports/pending-signup.repository.port';
import type UserRepositoryPort from '../../ports/user.repository.port';
import {
  PENDING_SIGNUP_REPOSITORY,
  USER_REPOSITORY,
} from '../../../shared/tokens/port.token';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

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
    @Inject(FILE_STORAGE_SERVICE)
    private readonly files: FileStorageServicePort,
  ) {}

  async execute(command: SignupUserCommand): Promise<{ otpSent: true }> {
    const phone = Phone.parse(command.phone).toString();
    const firstName = command.firstName.trim();
    const lastName = command.lastName.trim();
    if (!firstName || !lastName) {
      throw new InvalidSignupFieldError(
        'First name and last name are required',
      );
    }

    const existing = await this.users.findByPhone(phone);
    if (existing) {
      throw new PhoneAlreadyRegisteredError();
    }

    const activityType = command.activityType?.trim() || null;
    const guildType = command.guildType?.trim() || null;
    const industryType = command.industryType?.trim() || null;
    const category = command.category?.trim() || null;

    if (command.accountType === AccountType.BUYER) {
      if (!activityType || !guildType) {
        throw new InvalidSignupFieldError(
          'Activity type and guild are required for buyers',
        );
      }
    }

    let documentKey: string | null = null;
    let documentType: string | null = command.documentType?.trim() || null;

    if (isSellerAccountType(command.accountType)) {
      if (!industryType || !category || !activityType) {
        throw new InvalidSignupFieldError(
          'Industry, category, and activity type are required for sellers',
        );
      }
      if (!command.document?.buffer?.length) {
        throw new InvalidSignupFieldError(
          'National ID or business license is required',
        );
      }
      if (!ALLOWED_MIME.has(command.document.mimeType)) {
        throw new InvalidSignupFieldError('Unsupported document type');
      }
      documentType = documentType || 'BUSINESS_LICENSE';
      const extension = this.extension(
        command.document.originalName,
        command.document.mimeType,
      );
      const key = `signup/${phone}/${randomUUID()}${extension}`;
      documentKey = await this.files.upload(
        key,
        command.document.buffer,
        command.document.mimeType,
      );
    }

    const issued = await this.otp.issue(phone);
    if (!issued.ok) {
      throw new OtpRateLimitedError();
    }

    await this.pending.save(phone, {
      firstName,
      lastName,
      channel: command.channel,
      accountType: command.accountType,
      activityType,
      guildType,
      industryType,
      category,
      documentType,
      documentKey,
    });
    await this.sms.send(phone, `Virashops code: ${issued.code}`);

    return { otpSent: true };
  }

  private extension(name: string, mime: string): string {
    const fromName = name.includes('.')
      ? name.slice(name.lastIndexOf('.')).toLowerCase()
      : '';
    if (fromName) {
      return fromName;
    }
    if (mime === 'application/pdf') {
      return '.pdf';
    }
    return '.jpg';
  }
}
