import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';
import { FILE_STORAGE_SERVICE } from '../../../../shared/tokens/port.tokens';
import { SignupStep2Command } from '../commands/signup-user.command';
import InvalidSignupFieldError from '../../errors/invalid-signup-field.error';
import AccountType from '../../model/enums/account-type.enum';
import Phone from '../../model/phone';
import { isSellerAccountType } from '../../model/roles-from-signup';
import type PendingSignupRepositoryPort from '../../ports/pending-signup.repository.port';
import type UserRepositoryPort from '../../ports/user.repository.port';
import {
  PENDING_SIGNUP_REPOSITORY,
  USER_REPOSITORY,
} from '../../../shared/tokens/port.token';
import AuthSession from '../../view-models/auth-session.view-model';
import User from '../../model/user.model';
import rolesFromSignup, {
  sellerKindFromSignup,
} from '../../model/roles-from-signup';
import type CreatePendingSellerPort from '../../ports/create-pending-seller.port';
import { CREATE_PENDING_SELLER } from '../../../shared/tokens/port.token';
import IssueSessionUseCase from './issue-session.usecase';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Injectable()
export default class SignupStep2UseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(PENDING_SIGNUP_REPOSITORY)
    private readonly pending: PendingSignupRepositoryPort,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly files: FileStorageServicePort,
    private readonly issueSession: IssueSessionUseCase,
    @Inject(CREATE_PENDING_SELLER)
    private readonly createSeller: CreatePendingSellerPort,
  ) {}

  async execute(command: SignupStep2Command): Promise<AuthSession> {
    const phone = Phone.parse(command.phone).toString();

    const signup = await this.pending.find(phone);
    if (!signup) {
      throw new InvalidSignupFieldError('Signup session not found or expired');
    }

    // OTP verify advances the pending draft from step 1 → 2 before role/profile.
    if (signup.step !== 2) {
      throw new InvalidSignupFieldError(
        'Verify OTP before completing signup step 2',
      );
    }

    if (!signup.firstName || !signup.lastName) {
      throw new InvalidSignupFieldError('Step 1 data is incomplete');
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

    const user = await this.users.save(
      User.createFromSignup({
        phone,
        firstName: signup.firstName,
        lastName: signup.lastName,
        roles: rolesFromSignup(command.channel, command.accountType),
        activityType,
        guildType,
      }),
    );

    if (isSellerAccountType(command.accountType)) {
      const kind = sellerKindFromSignup(command.channel, command.accountType);
      if (
        !kind ||
        !industryType ||
        !category ||
        !activityType ||
        !documentKey
      ) {
        throw new InvalidSignupFieldError('Seller signup data is incomplete');
      }
      await this.createSeller.create({
        userId: user.getId(),
        kind,
        industryType,
        category,
        activityType,
        documentType: documentType ?? 'BUSINESS_LICENSE',
        documentKey,
      });
    }

    await this.pending.delete(phone);

    return this.issueSession.execute(user);
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
