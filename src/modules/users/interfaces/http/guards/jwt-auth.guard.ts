import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import type TokenDenylistPort from '../../../../shared/application/ports/token-denylist.port';
import type TokenServicePort from '../../../../shared/application/ports/token-service.port';
import {
  TOKEN_DENYLIST,
  TOKEN_SERVICE,
} from '../../../../shared/tokens/port.tokens';
import UnauthorizedError from '../../../domain/errors/unauthorized.error';
import type UserRepositoryPort from '../../../domain/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../shared/tokens/port.token';
import { JwtPayload } from '../../../domain/application/usecases/issue-session.usecase';
import AccountInactiveError from '../../../domain/errors/account-inactive.error';

@Injectable()
export default class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokens: TokenServicePort,
    @Inject(TOKEN_DENYLIST)
    private readonly denylist: TokenDenylistPort,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      throw new UnauthorizedError();
    }

    let payload: JwtPayload;
    try {
      payload = await this.tokens.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedError();
    }

    if (payload.jti && (await this.denylist.isDenied(payload.jti))) {
      throw new UnauthorizedError();
    }

    const userId = Number(payload.sub);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    if (!user.isActive()) {
      throw new AccountInactiveError();
    }

    request.user = user;
    return true;
  }
}
