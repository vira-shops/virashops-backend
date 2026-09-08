export default interface TotpServicePort {
  generateSecret(): string;
  generateUri(accountName: string, secret: string): string;
  verify(token: string, secret: string): boolean;
}
