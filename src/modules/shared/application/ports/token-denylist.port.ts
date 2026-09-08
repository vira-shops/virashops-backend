export default interface TokenDenylistPort {
  add(jti: string, ttlSeconds: number): Promise<void>;
  isDenied(jti: string): Promise<boolean>;
}
