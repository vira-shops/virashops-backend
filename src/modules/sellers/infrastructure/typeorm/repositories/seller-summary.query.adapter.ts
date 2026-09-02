import { Inject, Injectable } from '@nestjs/common';
import type { SellerSummary } from '../../../../users/domain/ports/seller-summary.query.port';
import type SellerSummaryQueryPort from '../../../../users/domain/ports/seller-summary.query.port';
import type SellerRepositoryPort from '../../../domain/ports/seller.repository.port';
import { SELLER_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class TypeOrmSellerSummaryQueryAdapter implements SellerSummaryQueryPort {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
  ) {}

  async findByUserId(userId: number): Promise<SellerSummary | null> {
    const seller = await this.sellers.findByUserId(userId);
    if (!seller) {
      return null;
    }
    return {
      id: seller.getId(),
      kind: seller.getKind(),
      status: seller.getStatus(),
      shopName: seller.getShopName(),
    };
  }
}
