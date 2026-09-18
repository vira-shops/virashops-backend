import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import FileStorageServicePort from '../application/ports/s3-storage.service.port';
import IdempotencyService from '../domain/application/services/idempotency.service';
import {
  EMAIL_SERVICE,
  FILE_STORAGE_SERVICE,
  IDEMPOTENCY_LOCK,
  IDEMPOTENCY_REPOSITORY,
  IDEMPOTENCY_SERVICE,
  OTP_SERVICE,
  PASSWORD_HASHER,
  SMS_SERVICE,
  TOKEN_DENYLIST,
  TOKEN_SERVICE,
  TOTP_SERVICE,
} from '../tokens/port.tokens';
import DrizzleIdempotencyRepositoryAdapter from './drizzle/repositories/idempotency.repository.adapter';
import RedisOtpAdapter from './otp/redis-otp.adapter';
import RedisIdempotencyLockAdapter from './redis/redis-idempotency-lock.adapter';
import RedisModule from './redis/redis.module';
import PasswordHasherAdapter from './security/password-hasher.adapter';
import RedisTokenDenylistAdapter from './security/redis-token-denylist.adapter';
import TokenServiceAdapter from './security/token.service.adapter';
import EmailServiceAdapter from './services/email.service.adapter';
import TotpServiceAdapter from './services/totp.service.adapter';
import ConsoleSmsAdapter from './sms/console-sms.adapter';
import LocalFileStorageAdapter from './storage/local-file-storage.adapter';
import S3StorageAdapter from './storage/s3-storage.adapter';

@Module({
  imports: [
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            config.get<SignOptions['expiresIn']>('JWT_EXPIRES_IN') ?? '1d',
        },
      }),
    }),
  ],
  providers: [
    { provide: PASSWORD_HASHER, useClass: PasswordHasherAdapter },
    { provide: TOKEN_SERVICE, useClass: TokenServiceAdapter },
    { provide: TOKEN_DENYLIST, useClass: RedisTokenDenylistAdapter },
    {
      provide: FILE_STORAGE_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): FileStorageServicePort => {
        if (config.get<string>('AWS_S3_BUCKET')) {
          return new S3StorageAdapter(config);
        }
        return new LocalFileStorageAdapter();
      },
    },
    { provide: EMAIL_SERVICE, useClass: EmailServiceAdapter },
    { provide: TOTP_SERVICE, useClass: TotpServiceAdapter },
    { provide: SMS_SERVICE, useClass: ConsoleSmsAdapter },
    { provide: OTP_SERVICE, useClass: RedisOtpAdapter },
    {
      provide: IDEMPOTENCY_REPOSITORY,
      useClass: DrizzleIdempotencyRepositoryAdapter,
    },
    { provide: IDEMPOTENCY_LOCK, useClass: RedisIdempotencyLockAdapter },
    IdempotencyService,
    { provide: IDEMPOTENCY_SERVICE, useExisting: IdempotencyService },
  ],
  exports: [
    RedisModule,
    JwtModule,
    PASSWORD_HASHER,
    TOKEN_SERVICE,
    TOKEN_DENYLIST,
    FILE_STORAGE_SERVICE,
    EMAIL_SERVICE,
    TOTP_SERVICE,
    SMS_SERVICE,
    OTP_SERVICE,
    IDEMPOTENCY_REPOSITORY,
    IDEMPOTENCY_LOCK,
    IDEMPOTENCY_SERVICE,
    IdempotencyService,
  ],
})
export default class CoreInfrastructureModule {}
