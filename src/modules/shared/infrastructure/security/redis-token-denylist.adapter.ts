import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import TokenDenylistPort from '../../application/ports/token-denylist.port';
import { REDIS_CLIENT } from '../../tokens/port.tokens';

const PREFIX = 'jwt:denylist:';

@Injectable()
export default class RedisTokenDenylistAdapter implements TokenDenylistPort {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async add(jti: string, ttlSeconds: number): Promise<void> {
    const ttl = Math.max(1, ttlSeconds);
    await this.redis.set(`${PREFIX}${jti}`, '1', 'EX', ttl);
  }

  async isDenied(jti: string): Promise<boolean> {
    const value = await this.redis.get(`${PREFIX}${jti}`);
    return value !== null;
  }
}
