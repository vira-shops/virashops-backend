import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
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
import PendingSignupRepositoryPort from '../src/modules/users/domain/ports/pending-signup.repository.port';
import SellerSummaryQueryPort, {
  SellerSummary,
} from '../src/modules/users/domain/ports/seller-summary.query.port';
import UserRepositoryPort from '../src/modules/users/domain/ports/user.repository.port';
import {
  PENDING_SIGNUP_REPOSITORY,
  SELLER_SUMMARY_QUERY,
  USER_REPOSITORY,
} from '../src/modules/users/shared/tokens/port.token';

class InMemoryUserRepository implements UserRepositoryPort {
  private readonly byId = new Map<number, User>();
  private seq = 1;

  async findById(id: number): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return [...this.byId.values()].find((user) => user.getPhone() === phone) ?? null;
  }

  async save(user: User): Promise<User> {
    if (!user.hasId()) {
      user.assignPersistedId(this.seq++);
    }
    this.byId.set(user.getId(), user);
    return user;
  }
}

class InMemorySellerRepository implements SellerRepositoryPort {
  private readonly byId = new Map<number, Seller>();
  private seq = 1;

  async findById(id: number): Promise<Seller | null> {
    return this.byId.get(id) ?? null;
  }

  async findByUserId(userId: number): Promise<Seller | null> {
    return (
      [...this.byId.values()].find((seller) => seller.getUserId() === userId) ??
      null
    );
  }

  async save(seller: Seller): Promise<Seller> {
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
        documentType: seller.getDocumentType(),
        documentKey: seller.getDocumentKey(),
        status: seller.getStatus(),
      });
      this.byId.set(restored.getId(), restored);
      return restored;
    }
    this.byId.set(seller.getId(), seller);
    return seller;
  }
}

class InMemoryOtp implements OtpServicePort {
  private readonly codes = new Map<string, string>();

  async issue(phone: string): Promise<IssueOtpResult> {
    this.codes.set(phone, '123456');
    return { ok: true, code: '123456' };
  }

  async verify(phone: string, code: string): Promise<VerifyOtpResult> {
    const stored = this.codes.get(phone);
    if (!stored) {
      return { ok: false, reason: 'EXPIRED' };
    }
    if (stored !== code) {
      return { ok: false, reason: 'INVALID' };
    }
    this.codes.delete(phone);
    return { ok: true };
  }

  expire(phone: string): void {
    this.codes.delete(phone);
  }
}

class InMemoryPendingSignup implements PendingSignupRepositoryPort {
  private readonly store = new Map<string, string>();

  async save(phone: string, fullName: string): Promise<void> {
    this.store.set(phone, fullName);
  }

  async find(phone: string): Promise<{ fullName: string } | null> {
    const fullName = this.store.get(phone);
    return fullName ? { fullName } : null;
  }

  async delete(phone: string): Promise<void> {
    this.store.delete(phone);
  }
}

class InMemoryDenylist implements TokenDenylistPort {
  private readonly denied = new Set<string>();

  async add(jti: string): Promise<void> {
    this.denied.add(jti);
  }

  async isDenied(jti: string): Promise<boolean> {
    return this.denied.has(jti);
  }
}

class InMemoryFiles implements FileStorageServicePort {
  async upload(key: string): Promise<string> {
    return key;
  }

  async delete(): Promise<void> {
    return;
  }

  async getSignedUrl(key: string): Promise<string> {
    return key;
  }
}

class ConsoleSms implements SmsServicePort {
  async send(): Promise<void> {
    return;
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
        UpdateSellerStatusUseCase,
        JwtAuthGuard,
        RolesGuard,
        TokenServiceAdapter,
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: USER_REPOSITORY, useValue: users },
        { provide: PENDING_SIGNUP_REPOSITORY, useClass: InMemoryPendingSignup },
        { provide: SELLER_REPOSITORY, useValue: sellers },
        { provide: SELLER_SUMMARY_QUERY, useValue: sellerQuery },
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
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ fullName: 'Ali Rezaei', phone: '09121111111' })
      .expect(200);

    const verified = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '123456' })
      .expect(200);

    const token = verified.body.data.accessToken as string;
    expect(verified.body.data.user.roles).toEqual(['USER']);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body.data.fullName).toBe('Ali Rezaei');
    expect(me.body.data.phoneVerified).toBe(true);
  });

  it('logs in an existing user and rejects a wrong OTP', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: '09121111111' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '000000' })
      .expect(401);

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

    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '123456' })
      .expect(401);
  });

  it('registers a pending seller without OTP', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/sellers/signup')
      .field('kind', 'RETAIL')
      .field('fullName', 'Sara Seller')
      .field('phone', '09122222222')
      .field('shopName', 'Sara Shop')
      .field('province', 'Tehran')
      .field('city', 'Tehran')
      .field('salesType', 'STORE')
      .field('address', 'Valiasr')
      .field('documentType', 'NATIONAL_ID')
      .attach('document', Buffer.from('fake-id'), {
        filename: 'id.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.roles).toEqual([
      'USER',
      'RETAIL_SELLER',
    ]);
    expect(response.body.data.user.seller.status).toBe('PENDING');
    expect(response.body.data.user.phoneVerified).toBe(false);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${response.body.data.accessToken}`)
      .expect(200);
    expect(me.body.data.seller.status).toBe('PENDING');
  });

  it('returns 401 without a token and 403 for a user hitting admin routes', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);

    const login = await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: '09121111111' });
    expect(login.status).toBe(200);

    const verified = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '09121111111', code: '123456' })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/admin/sellers/1/status')
      .set('Authorization', `Bearer ${verified.body.data.accessToken}`)
      .send({ status: 'ACTIVE' })
      .expect(403);
  });
});
