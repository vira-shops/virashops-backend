import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { I18nModule } from 'nestjs-i18n';
import DrizzleModule from './database/drizzle.module';
import { validate } from './config/env.validation';
import { i18nConfig } from './config/i18n.config';
import HealthModule from './modules/health/health.module';
import AddressesModule from './modules/addresses/interfaces/addresses.module';
import CartsModule from './modules/carts/interfaces/carts.module';
import CategoriesModule from './modules/categories/interfaces/categories.module';
import DashboardModule from './modules/dashboard/interfaces/dashboard.module';
import FavoritesModule from './modules/favorites/interfaces/favorites.module';
import FilesModule from './modules/files/interfaces/files.module';
import NotificationsModule from './modules/notifications/interfaces/notifications.module';
import OrdersModule from './modules/orders/interfaces/orders.module';
import PaymentsModule from './modules/payments/interfaces/payments.module';
import ProductQuestionsModule from './modules/product-questions/interfaces/product-questions.module';
import ProductsModule from './modules/products/interfaces/products.module';
import SearchModule from './modules/search/interfaces/search.module';
import SellersModule from './modules/sellers/interfaces/sellers.module';
import ShippingModule from './modules/shipping/interfaces/shipping.module';
import CoreInfrastructureModule from './modules/shared/infrastructure/infrastructure.module';
import DomainExceptionFilter from './modules/shared/interface/http/filters/domain-exception.filter';
import ApiEnvelopeInterceptor from './modules/shared/interface/http/interceptors/api-envelope.interceptor';
import IdempotencyInterceptor from './modules/shared/interface/http/interceptors/idempotency.interceptor';
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
    ProductsModule,
    CategoriesModule,
    SearchModule,
    FilesModule,
    AddressesModule,
    CartsModule,
    ShippingModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    FavoritesModule,
    ProductQuestionsModule,
    DashboardModule,
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
      useClass: IdempotencyInterceptor,
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
