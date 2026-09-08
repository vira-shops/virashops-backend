import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import Redis from 'ioredis';
import OtpServicePort, {
  IssueOtpResult,
  VerifyOtpResult,
} from '../../application/ports/otp.service.port';
import { REDIS_CLIENT } from '../../tokens/port.tokens';

const CODE_PREFIX = 'otp:code:';
const COOLDOWN_PREFIX = 'otp:cooldown:';
const ATTEMPTS_PREFIX = 'otp:attempts:';
const RATE_PREFIX = 'otp:rl:';
const MAX_SMS_PER_WINDOW = 5;
const RATE_WINDOW_SECONDS = 600;
const MAX_VERIFY_ATTEMPTS = 5;

@Injectable()
export default class RedisOtpAdapter implements OtpServicePort {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async issue(phone: string): Promise<IssueOtpResult> {
    const cooldownTtl = this.config.get<number>('OTP_RESEND_SECONDS') ?? 60;
    const ttl = this.config.get<number>('OTP_TTL_SECONDS') ?? 120;

    const sent = await this.redis.get(`${RATE_PREFIX}${phone}`);
    if (sent && Number(sent) >= MAX_SMS_PER_WINDOW) {
      return { ok: false, reason: 'RATE_LIMITED' };
    }

    const cooling = await this.redis.get(`${COOLDOWN_PREFIX}${phone}`);
    if (cooling) {
      return { ok: false, reason: 'RATE_LIMITED' };
    }

    const code = this.nextCode();
    const hash = this.hash(code);

    const pipeline = this.redis.multi();
    pipeline.set(`${CODE_PREFIX}${phone}`, hash, 'EX', ttl);
    pipeline.set(`${COOLDOWN_PREFIX}${phone}`, '1', 'EX', cooldownTtl);
    pipeline.incr(`${RATE_PREFIX}${phone}`);
    pipeline.del(`${ATTEMPTS_PREFIX}${phone}`);
    await pipeline.exec();

    const sentCount = Number((await this.redis.get(`${RATE_PREFIX}${phone}`)) ?? 0);
    if (sentCount === 1) {
      await this.redis.expire(`${RATE_PREFIX}${phone}`, RATE_WINDOW_SECONDS);
    }

    return { ok: true, code };
  }

  async verify(phone: string, code: string): Promise<VerifyOtpResult> {
    const stored = await this.redis.get(`${CODE_PREFIX}${phone}`);
    if (!stored) {
      return { ok: false, reason: 'EXPIRED' };
    }

    const attemptsKey = `${ATTEMPTS_PREFIX}${phone}`;
    const attempts = Number((await this.redis.get(attemptsKey)) ?? 0);
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      await this.redis.del(`${CODE_PREFIX}${phone}`);
      return { ok: false, reason: 'EXPIRED' };
    }

    if (!this.matches(code, stored)) {
      const count = await this.redis.incr(attemptsKey);
      if (count === 1) {
        const ttl = await this.redis.ttl(`${CODE_PREFIX}${phone}`);
        if (ttl > 0) {
          await this.redis.expire(attemptsKey, ttl);
        }
      }
      return { ok: false, reason: 'INVALID' };
    }

    await this.redis.del(
      `${CODE_PREFIX}${phone}`,
      attemptsKey,
      `${COOLDOWN_PREFIX}${phone}`,
    );
    return { ok: true };
  }

  private nextCode(): string {
    const length = this.config.get<number>('OTP_LENGTH') ?? 6;
    const devCode = this.config.get<string>('OTP_DEV_CODE');
    if (devCode) {
      return devCode.padStart(length, '0').slice(0, length);
    }

    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, '0');
  }

  private hash(code: string): string {
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    return createHmac('sha256', secret).update(code).digest('hex');
  }

  private matches(code: string, storedHash: string): boolean {
    const computed = this.hash(code);
    const left = Buffer.from(computed);
    const right = Buffer.from(storedHash);
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  }
}
