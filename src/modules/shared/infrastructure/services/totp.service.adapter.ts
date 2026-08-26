import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Secret, TOTP } from 'otpauth';
import TotpServicePort from '../../application/ports/totp.service.port';

@Injectable()
export default class TotpServiceAdapter implements TotpServicePort {
  private readonly issuer: string;

  constructor(private readonly config: ConfigService) {
    this.issuer = config.get<string>('TOTP_ISSUER') ?? 'Virashops';
  }

  generateSecret(): string {
    return new Secret({ size: 20 }).base32;
  }

  generateUri(accountName: string, secret: string): string {
    return new TOTP({
      issuer: this.issuer,
      label: accountName,
      secret: Secret.fromBase32(secret),
    }).toString();
  }

  verify(token: string, secret: string): boolean {
    const totp = new TOTP({
      issuer: this.issuer,
      secret: Secret.fromBase32(secret),
    });
    return totp.validate({ token, window: 1 }) !== null;
  }
}
