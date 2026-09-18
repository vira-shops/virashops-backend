export default interface IdempotencyLockPort {
  tryAcquire(
    lockKey: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean>;
  release(lockKey: string, token: string): Promise<void>;
}
