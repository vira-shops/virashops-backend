import { createHmac } from 'crypto';
import RedisOtpAdapter from './redis-otp.adapter';

describe('RedisOtpAdapter', () => {
  const store = new Map<string, { value: string; expireAt?: number }>();
  const redis = {
    get: async (key: string) => store.get(key)?.value ?? null,
    set: async (key: string, value: string, _ex?: string, ttl?: number) => {
      store.set(key, {
        value,
        expireAt: ttl ? Date.now() + ttl * 1000 : undefined,
      });
    },
    incr: async (key: string) => {
      const next = Number(store.get(key)?.value ?? 0) + 1;
      store.set(key, { value: String(next) });
      return next;
    },
    expire: async () => 1,
    del: async (...keys: string[]) => {
      keys.forEach((key) => store.delete(key));
      return keys.length;
    },
    ttl: async () => 60,
    multi: () => {
      const ops: Array<() => Promise<unknown>> = [];
      const chain = {
        set: (key: string, value: string, _ex: string, ttl: number) => {
          ops.push(() => redis.set(key, value, _ex, ttl));
          return chain;
        },
        incr: (key: string) => {
          ops.push(() => redis.incr(key));
          return chain;
        },
        expire: () => {
          ops.push(async () => 1);
          return chain;
        },
        del: (key: string) => {
          ops.push(() => redis.del(key));
          return chain;
        },
        exec: async () => {
          for (const op of ops) {
            await op();
          }
        },
      };
      return chain;
    },
  };

  const adapter = new RedisOtpAdapter(redis as never, {
    get: (key: string) => {
      const values: Record<string, unknown> = {
        OTP_TTL_SECONDS: 120,
        OTP_RESEND_SECONDS: 60,
        OTP_LENGTH: 6,
        OTP_DEV_CODE: '123456',
      };
      return values[key];
    },
    getOrThrow: () => 'secret',
  } as never);

  beforeEach(() => store.clear());

  it('issues a hashed code and verifies it', async () => {
    const issued = await adapter.issue('09123456789');
    expect(issued).toEqual({ ok: true, code: '123456' });

    const hash = createHmac('sha256', 'secret').update('123456').digest('hex');
    expect(store.get('otp:code:09123456789')?.value).toBe(hash);

    await expect(adapter.verify('09123456789', '123456')).resolves.toEqual({
      ok: true,
    });
  });

  it('rejects a wrong code', async () => {
    await adapter.issue('09123456789');
    await expect(adapter.verify('09123456789', '000000')).resolves.toEqual({
      ok: false,
      reason: 'INVALID',
    });
  });

  it('rate-limits resend while cooldown is set', async () => {
    await adapter.issue('09123456789');
    await expect(adapter.issue('09123456789')).resolves.toEqual({
      ok: false,
      reason: 'RATE_LIMITED',
    });
  });
});
