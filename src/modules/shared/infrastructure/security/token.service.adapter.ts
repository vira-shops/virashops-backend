import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import TokenServicePort from '../../application/ports/token-service.port';

@Injectable()
export default class TokenServiceAdapter implements TokenServicePort {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sign(
    payload: Record<string, unknown>,
    expiresIn?: string,
  ): Promise<string> {
    const expires =
      (expiresIn as SignOptions['expiresIn']) ??
      this.config.get<SignOptions['expiresIn']>('JWT_EXPIRES_IN') ??
      '1d';

    return this.jwt.signAsync(payload, { expiresIn: expires });
  }

  async verify<T extends object = Record<string, unknown>>(
    token: string,
  ): Promise<T> {
    return this.jwt.verifyAsync<T>(token);
  }
}
