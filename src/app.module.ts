import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { I18nModule } from 'nestjs-i18n';
import DrizzleModule from './database/drizzle.module';
import { validate } from './config/env.validation';
import { i18nConfig } from './config/i18n.config';
import HealthModule from './modules/health/health.module';
import SellersModule from './modules/sellers/interfaces/sellers.module';
import CoreInfrastructureModule from './modules/shared/infrastructure/infrastructure.module';
import DomainExceptionFilter from './modules/shared/interface/http/filters/domain-exception.filter';
import ApiEnvelopeInterceptor from './modules/shared/interface/http/interceptors/api-envelope.interceptor';
import UsersModule from './modules/users/interfaces/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    DrizzleModule,
    I18nModule.forRoot(i18nConfig),
    EventEmitterModule.forRoot(),
    CoreInfrastructureModule,
    HealthModule,
    UsersModule,
    SellersModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiEnvelopeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
