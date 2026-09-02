import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import ForbiddenError from '../../../domain/errors/forbidden.error';
import UnauthorizedError from '../../../domain/errors/unauthorized.error';
import Role from '../../../domain/model/enums/role.enum';
import User from '../../../domain/model/user.model';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export default class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as unknown as User | undefined;
    if (!user) {
      throw new UnauthorizedError();
    }

    const allowed = required.some((role) => user.hasRole(role));
    if (!allowed) {
      throw new ForbiddenError();
    }
    return true;
  }
}
