import { Inject, Injectable } from '@nestjs/common';
import type { SellerSummary } from '../../../../users/domain/ports/seller-summary.query.port';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import { SELLER_REPOSITORY } from '../../../shared/tokens/port.token';
import GetSellerByUserIdQuery from '../queries/get-seller-by-user-id.query';

@Injectable()
export default class GetSellerByUserIdUseCase {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
  ) {}

  async execute(query: GetSellerByUserIdQuery): Promise<SellerSummary | null> {
    const seller = await this.sellers.findByUserId(query.userId);
    if (!seller) {
      return null;
    }
    return {
      id: seller.getId(),
      kind: seller.getKind(),
      status: seller.getStatus(),
      shopName: seller.getShopName(),
      profileComplete: seller.isProfileComplete(),
    };
  }
}
