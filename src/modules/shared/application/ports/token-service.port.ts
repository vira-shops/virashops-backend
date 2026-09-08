export default interface TokenServicePort {
  sign(payload: Record<string, unknown>, expiresIn?: string): Promise<string>;
  verify<T extends object = Record<string, unknown>>(token: string): Promise<T>;
}
