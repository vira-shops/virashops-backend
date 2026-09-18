import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import IdempotencyLockPort from '../../application/ports/idempotency.lock.port';
import { REDIS_CLIENT } from '../../tokens/port.tokens';

@Injectable()
export default class RedisIdempotencyLockAdapter implements IdempotencyLockPort {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async tryAcquire(
    lockKey: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.redis.set(lockKey, token, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async release(lockKey: string, token: string): Promise<void> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.redis.eval(script, 1, lockKey, token);
  }
}
