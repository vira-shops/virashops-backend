import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import User from '../../../domain/model/user.model';

const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as unknown as User;
  },
);

export default CurrentUser;
