import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import {
  EMAIL_SERVICE,
  FILE_STORAGE_SERVICE,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  TOTP_SERVICE,
} from '../tokens/port.tokens';
import RedisModule from './redis/redis.module';
import PasswordHasherAdapter from './security/password-hasher.adapter';
import TokenServiceAdapter from './security/token.service.adapter';
import S3StorageAdapter from './storage/s3-storage.adapter';
import EmailServiceAdapter from './services/email.service.adapter';
import TotpServiceAdapter from './services/totp.service.adapter';

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
    { provide: FILE_STORAGE_SERVICE, useClass: S3StorageAdapter },
    { provide: EMAIL_SERVICE, useClass: EmailServiceAdapter },
    { provide: TOTP_SERVICE, useClass: TotpServiceAdapter },
  ],
  exports: [
    RedisModule,
    JwtModule,
    PASSWORD_HASHER,
    TOKEN_SERVICE,
    FILE_STORAGE_SERVICE,
    EMAIL_SERVICE,
    TOTP_SERVICE,
  ],
})
export default class CoreInfrastructureModule {}
