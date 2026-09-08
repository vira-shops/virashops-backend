import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { I18nModule } from 'nestjs-i18n';
import request from 'supertest';
import { App } from 'supertest/types';
import { i18nConfig } from '../src/config/i18n.config';
import OtpServicePort, {
  IssueOtpResult,
  VerifyOtpResult,
} from '../src/modules/shared/application/ports/otp.service.port';
import FileStorageServicePort from '../src/modules/shared/application/ports/s3-storage.service.port';
import SmsServicePort from '../src/modules/shared/application/ports/sms.service.port';
import TokenDenylistPort from '../src/modules/shared/application/ports/token-denylist.port';
import DomainExceptionFilter from '../src/modules/shared/interface/http/filters/domain-exception.filter';
import ApiEnvelopeInterceptor from '../src/modules/shared/interface/http/interceptors/api-envelope.interceptor';
import TokenServiceAdapter from '../src/modules/shared/infrastructure/security/token.service.adapter';
import {
  FILE_STORAGE_SERVICE,
  OTP_SERVICE,
  SMS_SERVICE,
  TOKEN_DENYLIST,
  TOKEN_SERVICE,
} from '../src/modules/shared/tokens/port.tokens';
import AdminSellersController from '../src/modules/sellers/interfaces/http/controllers/admin-sellers.controller';
import SellerAuthController from '../src/modules/sellers/interfaces/http/controllers/seller-auth.controller';
import CompleteSellerProfileUseCase from '../src/modules/sellers/domain/application/usecases/complete-seller-profile.usecase';
import SignupSellerUseCase from '../src/modules/sellers/domain/application/usecases/signup-seller.usecase';
import UpdateSellerStatusUseCase from '../src/modules/sellers/domain/application/usecases/update-seller-status.usecase';
import Seller from '../src/modules/sellers/domain/model/seller.model';
import SellerRepositoryPort from '../src/modules/sellers/domain/ports/seller.repository.port';
import { SELLER_REPOSITORY } from '../src/modules/sellers/shared/tokens/port.token';
import AuthController from '../src/modules/users/interfaces/http/controllers/auth.controller';
import JwtAuthGuard from '../src/modules/users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../src/modules/users/interfaces/http/guards/roles.guard';
import EnsureUserForSellerUseCase from '../src/modules/users/domain/application/usecases/ensure-user-for-seller.usecase';
import GetMeUseCase from '../src/modules/users/domain/application/usecases/get-me.usecase';
import IssueSessionUseCase from '../src/modules/users/domain/application/usecases/issue-session.usecase';
import LogoutUseCase from '../src/modules/users/domain/application/usecases/logout.usecase';
import RequestOtpUseCase from '../src/modules/users/domain/application/usecases/request-otp.usecase';
import SignupUserUseCase from '../src/modules/users/domain/application/usecases/signup-user.usecase';
import VerifyOtpUseCase from '../src/modules/users/domain/application/usecases/verify-otp.usecase';
import User from '../src/modules/users/domain/model/user.model';
import PendingSignupRepositoryPort, {
  PendingSignupDraft,
} from '../src/modules/users/domain/ports/pending-signup.repository.port';
import SellerSummaryQueryPort, {
  SellerSummary,
} from '../src/modules/users/domain/ports/seller-summary.query.port';
import UserRepositoryPort from '../src/modules/users/domain/ports/user.repository.port';
import {
  CREATE_PENDING_SELLER,
  PENDING_SIGNUP_REPOSITORY,
  SELLER_SUMMARY_QUERY,
  USER_REPOSITORY,
} from '../src/modules/users/shared/tokens/port.token';

type ApiEnvelope<T> = { status: number; data: T };
type ApiErrorData = { errorCode: string; message?: string };
type AuthUserBody = {
  fullName?: string;
  firstName?: string;
  phoneVerified?: boolean;
  roles?: string[];
  seller?: { status: string; profileComplete?: boolean } | null;
};
type SessionBody = { accessToken: string; user: AuthUserBody };

function apiBody<T>(res: { body: unknown }): ApiEnvelope<T> {
  return res.body as ApiEnvelope<T>;
}

class InMemoryUserRepository implements UserRepositoryPort {
  private readonly byId = new Map<number, User>();
  private seq = 1;

  findById(id: number): Promise<User | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  findByPhone(phone: string): Promise<User | null> {
    return Promise.resolve(
      [...this.byId.values()].find((user) => user.getPhone() === phone) ?? null,
    );
  }

  save(user: User): Promise<User> {
    if (!user.hasId()) {
      user.assignPersistedId(this.seq++);
    }
    this.byId.set(user.getId(), user);
    return Promise.resolve(user);
  }
}

class InMemorySellerRepository implements SellerRepositoryPort {
  private readonly byId = new Map<number, Seller>();
  private seq = 1;

  findById(id: number): Promise<Seller | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  findByUserId(userId: number): Promise<Seller | null> {
    return Promise.resolve(
      [...this.byId.values()].find((seller) => seller.getUserId() === userId) ??
        null,
    );
  }

  save(seller: Seller): Promise<Seller> {
    if (!seller.hasId()) {
      const restored = Seller.restore({
        id: this.seq++,
        userId: seller.getUserId(),
        kind: seller.getKind(),
        shopName: seller.getShopName(),
        workplacePhone: seller.getWorkplacePhone(),
        province: seller.getProvince(),
        city: seller.getCity(),
        postalCode: seller.getPostalCode(),
        salesType: seller.getSalesType(),
        address: seller.getAddress(),
        industryType: seller.getIndustryType(),
        category: seller.getCategory(),
        activityType: seller.getActivityType(),
        documentType: seller.getDocumentType(),
        documentKey: seller.getDocumentKey(),
        status: seller.getStatus(),
      });
      this.byId.set(restored.getId(), restored);
      return Promise.resolve(restored);
    }
    this.byId.set(seller.getId(), seller);
    return Promise.resolve(seller);
  }
}

class InMemoryOtp implements OtpServicePort {
  private readonly codes = new Map<string, string>();

  issue(phone: string): Promise<IssueOtpResult> {
    this.codes.set(phone, '123456');
    return Promise.resolve({ ok: true, code: '123456' });
  }

  verify(phone: string, code: string): Promise<VerifyOtpResult> {
    const stored = this.codes.get(phone);
    if (!stored) {
      return Promise.resolve({ ok: false, reason: 'EXPIRED' });
    }
    if (stored !== code) {
      return Promise.resolve({ ok: false, reason: 'INVALID' });
    }
    this.codes.delete(phone);
    return Promise.resolve({ ok: true });
  }

  expire(phone: string): void {
    this.codes.delete(phone);
  }
}

class InMemoryPendingSignup implements PendingSignupRepositoryPort {
  private readonly store = new Map<string, PendingSignupDraft>();

  save(phone: string, draft: PendingSignupDraft): Promise<void> {
    this.store.set(phone, draft);
    return Promise.resolve();
  }

  find(phone: string): Promise<PendingSignupDraft | null> {
    return Promise.resolve(this.store.get(phone) ?? null);
  }

  delete(phone: string): Promise<void> {
    this.store.delete(phone);
    return Promise.resolve();
  }
}

class InMemoryDenylist implements TokenDenylistPort {
  private readonly denied = new Set<string>();

  add(jti: string, ttlSeconds: number): Promise<void> {
    void ttlSeconds;
    this.denied.add(jti);
    return Promise.resolve();
  }

  isDenied(jti: string): Promise<boolean> {
    return Promise.resolve(this.denied.has(jti));
  }
}

class InMemoryFiles implements FileStorageServicePort {
  upload(key: string): Promise<string> {
    return Promise.resolve(key);
  }

  delete(): Promise<void> {
    return Promise.resolve();
  }

  getSignedUrl(key: string): Promise<string> {
    return Promise.resolve(key);
  }
}

class ConsoleSms implements SmsServicePort {
  send(): Promise<void> {
    return Promise.resolve();
  }
}

describe('Auth HTTP', () => {
  let app: INestApplication<App>;
  const otp = new InMemoryOtp();
  const users = new InMemoryUserRepository();
  const sellers = new InMemorySellerRepository();
  const sellerQuery: SellerSummaryQueryPort = {
    async findByUserId(userId: number): Promise<SellerSummary | null> {
      const seller = await sellers.findByUserId(userId);
      if (!seller) {
        return null;
      }
      return {
        id: seller.getId(),
        kind: seller.getKind(),
        status: seller.getStatus(),
        shopName: seller.getShopName(),
        profileComplete: seller.isProfileComplete(),
      };
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'test-secret',
              JWT_EXPIRES_IN: '1d',
            }),
          ],
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1d' },
        }),
        I18nModule.forRoot(i18nConfig),
      ],
      controllers: [
        AuthController,
        SellerAuthController,
        AdminSellersController,
      ],
      providers: [
        SignupUserUseCase,
        RequestOtpUseCase,
        VerifyOtpUseCase,
        LogoutUseCase,
        GetMeUseCase,
        IssueSessionUseCase,
        EnsureUserForSellerUseCase,
        SignupSellerUseCase,
        CompleteSellerProfileUseCase,
        UpdateSellerStatusUseCase,
        JwtAuthGuard,
        RolesGuard,
        TokenServiceAdapter,
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ApiEnvelopeInterceptor },
        { provide: USER_REPOSITORY, useValue: users },
        { provide: PENDING_SIGNUP_REPOSITORY, useClass: InMemoryPendingSignup },
        { provide: SELLER_REPOSITORY, useValue: sellers },
        { provide: SELLER_SUMMARY_QUERY, useValue: sellerQuery },
        { provide: CREATE_PENDING_SELLER, useExisting: SignupSellerUseCase },
        { provide: OTP_SERVICE, useValue: otp },
        { provide: SMS_SERVICE, useClass: ConsoleSms },
        { provide: TOKEN_SERVICE, useClass: TokenServiceAdapter },
        { provide: TOKEN_DENYLIST, useClass: InMemoryDenylist },
        { provide: FILE_STORAGE_SERVICE, useClass: InMemoryFiles },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('signs up a buyer with OTP then returns the profile', async () => {
    const signup = await request(app.getHttpServer())
      .post('/auth/signup')
      .field('firstName', 'Ali')
      .field('lastName', 'Rezaei')
      .field('phone', '09121111111')
      .field('channel', 'RETAIL')
      .field('accountType', 'BUYER')
      .field('activityType', 'STORE')
      .field('guildType', 'FOOD')
      .expect(200);

    const signupBody = apiBody<{ otpSent: boolean }>(signup);
    expect(signupBody.status).toBe(200);
    expect(signupBody.data.otpSent).toBe(true);

    const verified = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '123456' })
      .expect(200);

    const session = apiBody<SessionBody>(verified);
    expect(session.status).toBe(200);
    const token = session.data.accessToken;
    expect(session.data.user.roles).toEqual(['RETAIL_BUYER']);
    expect(session.data.accessToken).toBeDefined();

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const meBody = apiBody<AuthUserBody>(me);
    expect(meBody.status).toBe(200);
    expect(meBody.data.fullName).toBe('Ali Rezaei');
    expect(meBody.data.firstName).toBe('Ali');
    expect(meBody.data.phoneVerified).toBe(true);
  });

  it('rejects a 5-digit OTP', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '12345' })
      .expect(400);

    const body = apiBody<ApiErrorData>(invalid);
    expect(body.status).toBe(400);
    expect(body.data.errorCode).toBe('VALIDATION');
    expect(body.data.message).toBeDefined();
  });

  it('logs in an existing user and rejects a wrong OTP', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: '09121111111' })
      .expect(200);

    const wrong = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '000000' })
      .expect(401);

    const body = apiBody<ApiErrorData>(wrong);
    expect(body.status).toBe(401);
    expect(body.data.errorCode).toBe('INVALID_OTP');
    expect(body.data.message).toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '123456' })
      .expect(200);
  });

  it('rejects expired OTP', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: '09121111111' })
      .expect(200);
    otp.expire('09121111111');

    const expired = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '123456' })
      .expect(401);

    const body = apiBody<ApiErrorData>(expired);
    expect(body.status).toBe(401);
    expect(body.data.errorCode).toBe('OTP_EXPIRED');
  });

  it('registers a pending seller only after OTP', async () => {
    const signup = await request(app.getHttpServer())
      .post('/auth/signup')
      .field('firstName', 'Sara')
      .field('lastName', 'Seller')
      .field('phone', '09122222222')
      .field('channel', 'RETAIL')
      .field('accountType', 'SELLER')
      .field('activityType', 'STORE')
      .field('industryType', 'FOOD')
      .field('category', 'CANNED')
      .field('documentType', 'NATIONAL_ID')
      .attach('document', Buffer.from('fake-id'), {
        filename: 'id.jpg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    const signupBody = apiBody<{ otpSent: boolean; accessToken?: string }>(
      signup,
    );
    expect(signupBody.status).toBe(200);
    expect(signupBody.data.otpSent).toBe(true);
    expect(signupBody.data.accessToken).toBeUndefined();

    const verified = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09122222222', code: '123456' })
      .expect(200);

    const session = apiBody<SessionBody>(verified);
    expect(session.data.user.roles).toEqual(['RETAIL_BUYER', 'RETAIL_SELLER']);
    expect(session.data.user.seller?.status).toBe('PENDING');
    expect(session.data.user.seller?.profileComplete).toBe(false);
    expect(session.data.user.phoneVerified).toBe(true);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${session.data.accessToken}`)
      .expect(200);
    expect(apiBody<AuthUserBody>(me).data.seller?.status).toBe('PENDING');
  });

  it('completes a seller profile', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: '09122222222' })
      .expect(200);
    expect(login.status).toBe(200);

    const verified = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09122222222', code: '123456' })
      .expect(200);

    const token = apiBody<SessionBody>(verified).data.accessToken;
    const response = await request(app.getHttpServer())
      .patch('/auth/sellers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shopName: 'Sara Shop',
        province: 'Tehran',
        city: 'Tehran',
        salesType: 'STORE',
        address: 'Valiasr',
      })
      .expect(200);

    const body = apiBody<{ shopName: string; profileComplete: boolean }>(
      response,
    );
    expect(body.status).toBe(200);
    expect(body.data.shopName).toBe('Sara Shop');
    expect(body.data.profileComplete).toBe(true);
  });

  it('returns 401 without a token and 403 for a user hitting admin routes', async () => {
    const unauthorized = await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
    const unauthorizedBody = apiBody<ApiErrorData>(unauthorized);
    expect(unauthorizedBody.status).toBe(401);
    expect(unauthorizedBody.data.errorCode).toBe('UNAUTHORIZED');

    const login = await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: '09121111111' });
    expect(login.status).toBe(200);
    expect(apiBody<unknown>(login).status).toBe(200);

    const verified = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '123456' })
      .expect(200);

    const token = apiBody<SessionBody>(verified).data.accessToken;
    const forbidden = await request(app.getHttpServer())
      .patch('/admin/sellers/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' })
      .expect(403);

    const forbiddenBody = apiBody<ApiErrorData>(forbidden);
    expect(forbiddenBody.status).toBe(403);
    expect(forbiddenBody.data.errorCode).toBe('FORBIDDEN');
  });
});
