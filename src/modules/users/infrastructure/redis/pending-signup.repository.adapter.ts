import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../shared/tokens/port.tokens';
import PendingSignupRepositoryPort from '../../domain/ports/pending-signup.repository.port';

const PREFIX = 'signup:pending:';

@Injectable()
export default class RedisPendingSignupAdapter implements PendingSignupRepositoryPort {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async save(phone: string, fullName: string): Promise<void> {
    const ttl = this.config.get<number>('OTP_TTL_SECONDS') ?? 120;
    await this.redis.set(
      `${PREFIX}${phone}`,
      JSON.stringify({ fullName }),
      'EX',
      ttl,
    );
  }

  async find(phone: string): Promise<{ fullName: string } | null> {
    const raw = await this.redis.get(`${PREFIX}${phone}`);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { fullName?: string };
    if (!parsed.fullName) {
      return null;
    }
    return { fullName: parsed.fullName };
  }

  async delete(phone: string): Promise<void> {
    await this.redis.del(`${PREFIX}${phone}`);
  }
}
