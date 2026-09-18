import { Transform, plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) =>
  value === true || value === 'true';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api';

  @IsString()
  @IsOptional()
  SWAGGER_PATH: string = 'docs';

  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  DB_SYNC: boolean = false;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  DB_LOGGING: boolean = false;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1d';

  @IsNumber()
  @IsOptional()
  BCRYPT_SALT_ROUNDS: number = 10;

  @IsString()
  @IsOptional()
  AWS_REGION?: string;

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_S3_BUCKET?: string;

  @IsString()
  @IsOptional()
  AWS_S3_ENDPOINT?: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  AWS_S3_FORCE_PATH_STYLE: boolean = false;

  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT?: number;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  @IsString()
  @IsOptional()
  SMTP_FROM?: string;

  @IsString()
  @IsOptional()
  TOTP_ISSUER: string = 'Virashops';

  @IsNumber()
  @IsOptional()
  OTP_TTL_SECONDS: number = 120;

  @IsNumber()
  @IsOptional()
  OTP_LENGTH: number = 6;

  @IsNumber()
  @IsOptional()
  OTP_RESEND_SECONDS: number = 60;

  @IsString()
  @IsOptional()
  OTP_DEV_CODE?: string;

  @IsString()
  @IsOptional()
  ADMIN_PHONE?: string;

  @IsString()
  @IsOptional()
  ADMIN_NAME: string = 'Admin';

  @IsNumber()
  @IsOptional()
  PLATFORM_COMMISSION_PERCENT: number = 5;

  @IsNumber()
  @IsOptional()
  FREE_SHIPPING_THRESHOLD: number = 20_000_000;

  @IsString()
  @IsOptional()
  PAYMENT_STUB_REDIRECT_URL: string = 'https://pay.stub.local/redirect';

  @IsString()
  @IsOptional()
  CHEQUE_PAYEE_NAME: string = 'شرکت ویرا';

  @IsString()
  @IsOptional()
  CHEQUE_PAYEE_NATIONAL_ID: string = '1230123025';

  @IsString()
  @IsOptional()
  CHEQUE_MAILING_ADDRESS: string =
    'استان یزد، شهر اردکان، خیابان شهید رجایی، کوچه ۴۷، پلاک ۳۳۱';

  @IsString()
  @IsOptional()
  CHEQUE_MAILING_POSTAL_CODE: string = '1234567891';

  /** Hours a SUCCEEDED bank-account validation stays reusable before CHEQUE initiate. */
  @IsNumber()
  @IsOptional()
  BANK_VALIDATION_TTL_HOURS: number = 24;

  /** Optional stub override: force credit grade (A–E) for demos/QA. */
  @IsString()
  @IsOptional()
  BANK_INQUIRY_STUB_GRADE?: string;

  /** Optional stub override: force credit ceiling (Tomans). Requires STUB_GRADE. */
  @IsNumber()
  @IsOptional()
  BANK_INQUIRY_STUB_CEILING?: number;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}
