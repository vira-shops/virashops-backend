import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule } from 'nestjs-i18n';
import { validate } from './config/env.validation';
import { i18nConfig } from './config/i18n.config';
import { typeOrmConfig } from './config/typeorm.config';
import HealthModule from './modules/health/health.module';
import CoreInfrastructureModule from './modules/shared/infrastructure/infrastructure.module';
import DomainExceptionFilter from './modules/shared/interface/http/filters/domain-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    I18nModule.forRoot(i18nConfig),
    EventEmitterModule.forRoot(),
    CoreInfrastructureModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
