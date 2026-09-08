import { Inject, Injectable } from '@nestjs/common';
import SellerAlreadyExistsError from '../../../../users/domain/errors/seller-already-exists.error';
import type CreatePendingSellerPort from '../../../../users/domain/ports/create-pending-seller.port';
import type { CreatePendingSellerInput } from '../../../../users/domain/ports/create-pending-seller.port';
import type { SellerSummary } from '../../../../users/domain/ports/seller-summary.query.port';
import InvalidSellerFieldError from '../../errors/invalid-seller-field.error';
import SellerDocumentType from '../../model/enums/seller-document-type.enum';
import SellerKind from '../../model/enums/seller-kind.enum';
import Seller from '../../model/seller.model';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import { SELLER_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class SignupSellerUseCase implements CreatePendingSellerPort {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
  ) {}

  async create(input: CreatePendingSellerInput): Promise<SellerSummary> {
    return this.execute(input);
  }

  async execute(input: CreatePendingSellerInput): Promise<SellerSummary> {
    if (!Object.values(SellerKind).includes(input.kind as SellerKind)) {
      throw new InvalidSellerFieldError('Seller kind is required');
    }
    if (
      !input.industryType.trim() ||
      !input.category.trim() ||
      !input.activityType.trim()
    ) {
      throw new InvalidSellerFieldError(
        'Industry, category, and activity type are required',
      );
    }
    if (!input.documentKey.trim()) {
      throw new InvalidSellerFieldError('Document is required');
    }

    const existing = await this.sellers.findByUserId(input.userId);
    if (existing) {
      throw new SellerAlreadyExistsError();
    }

    const documentType = Object.values(SellerDocumentType).includes(
      input.documentType as SellerDocumentType,
    )
      ? (input.documentType as SellerDocumentType)
      : SellerDocumentType.BUSINESS_LICENSE;

    const saved = await this.sellers.save(
      Seller.create({
        userId: input.userId,
        kind: input.kind as SellerKind,
        shopName: null,
        workplacePhone: null,
        province: null,
        city: null,
        postalCode: null,
        salesType: null,
        address: null,
        industryType: input.industryType,
        category: input.category,
        activityType: input.activityType,
        documentType,
        documentKey: input.documentKey,
      }),
    );

    return {
      id: saved.getId(),
      kind: saved.getKind(),
      status: saved.getStatus(),
      shopName: saved.getShopName(),
      profileComplete: saved.isProfileComplete(),
    };
  }
}
