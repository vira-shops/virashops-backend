import { Inject, Injectable } from '@nestjs/common';
import type TokenDenylistPort from '../../../../shared/application/ports/token-denylist.port';
import type TokenServicePort from '../../../../shared/application/ports/token-service.port';
import {
  TOKEN_DENYLIST,
  TOKEN_SERVICE,
} from '../../../../shared/tokens/port.tokens';
import LogoutCommand from '../commands/logout.command';
import { JwtPayload } from './issue-session.usecase';

@Injectable()
export default class LogoutUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokens: TokenServicePort,
    @Inject(TOKEN_DENYLIST)
    private readonly denylist: TokenDenylistPort,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const payload = await this.tokens.verify<JwtPayload>(command.token);
    if (!payload.jti) {
      return;
    }
    const ttl = payload.exp
      ? payload.exp - Math.floor(Date.now() / 1000)
      : 86400;
    if (ttl > 0) {
      await this.denylist.add(payload.jti, ttl);
    }
  }
}
