import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import UnauthorizedError from '../../../../users/domain/errors/unauthorized.error';
import User from '../../../../users/domain/model/user.model';
import SellerNotActiveError from '../../../domain/errors/seller-not-active.error';
import type SellerRepositoryPort from '../../../domain/ports/seller.repository.port';
import { SELLER_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class SellerActiveGuard implements CanActivate {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as unknown as User | undefined;
    if (!user) {
      throw new UnauthorizedError();
    }

    const seller = await this.sellers.findByUserId(user.getId());
    if (!seller || !seller.isActive()) {
      throw new SellerNotActiveError();
    }
    return true;
  }
}
