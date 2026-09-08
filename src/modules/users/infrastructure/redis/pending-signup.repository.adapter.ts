import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../shared/tokens/port.tokens';
import AccountType from '../../domain/model/enums/account-type.enum';
import Channel from '../../domain/model/enums/channel.enum';
import PendingSignupRepositoryPort, {
  PendingSignupDraft,
} from '../../domain/ports/pending-signup.repository.port';

const PREFIX = 'signup:pending:';

@Injectable()
export default class RedisPendingSignupAdapter implements PendingSignupRepositoryPort {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async save(phone: string, draft: PendingSignupDraft): Promise<void> {
    const ttl = this.config.get<number>('OTP_TTL_SECONDS') ?? 120;
    await this.redis.set(`${PREFIX}${phone}`, JSON.stringify(draft), 'EX', ttl);
  }

  async find(phone: string): Promise<PendingSignupDraft | null> {
    const raw = await this.redis.get(`${PREFIX}${phone}`);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PendingSignupDraft>;
    if (
      !parsed.firstName ||
      !parsed.lastName ||
      !parsed.channel ||
      !parsed.accountType
    ) {
      return null;
    }
    if (
      !Object.values(Channel).includes(parsed.channel) ||
      !Object.values(AccountType).includes(parsed.accountType)
    ) {
      return null;
    }
    return {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      channel: parsed.channel,
      accountType: parsed.accountType,
      activityType: parsed.activityType ?? null,
      guildType: parsed.guildType ?? null,
      industryType: parsed.industryType ?? null,
      category: parsed.category ?? null,
      documentType: parsed.documentType ?? null,
      documentKey: parsed.documentKey ?? null,
    };
  }

  async delete(phone: string): Promise<void> {
    await this.redis.del(`${PREFIX}${phone}`);
  }
}
