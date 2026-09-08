import { Inject, Injectable } from '@nestjs/common';
import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import SellerNotFoundError from '../../errors/seller-not-found.error';
import SellerProfileIncompleteError from '../../errors/seller-profile-incomplete.error';
import SellerStatus from '../../model/enums/seller-status.enum';
import Seller from '../../model/seller.model';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import { SELLER_REPOSITORY } from '../../../shared/tokens/port.token';
import UpdateSellerStatusCommand from '../commands/update-seller-status.command';

@Injectable()
export default class UpdateSellerStatusUseCase {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
  ) {}

  async execute(command: UpdateSellerStatusCommand): Promise<Seller> {
    if (!command.actorRoles.includes(Role.ADMIN)) {
      throw new ForbiddenError();
    }

    const seller = await this.sellers.findById(command.sellerId);
    if (!seller) {
      throw new SellerNotFoundError();
    }

    if (command.status === SellerStatus.ACTIVE && !seller.isProfileComplete()) {
      throw new SellerProfileIncompleteError();
    }

    seller.transitionTo(command.status);
    return this.sellers.save(seller);
  }
}
