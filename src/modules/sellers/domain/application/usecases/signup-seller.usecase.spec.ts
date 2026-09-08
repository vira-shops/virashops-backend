import SellerAlreadyExistsError from '../../../../users/domain/errors/seller-already-exists.error';
import SellerKind from '../../model/enums/seller-kind.enum';
import SellerStatus from '../../model/enums/seller-status.enum';
import Seller from '../../model/seller.model';
import SignupSellerUseCase from './signup-seller.usecase';

describe('SignupSellerUseCase', () => {
  const sellers = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn((seller: Seller) => {
      if (!seller.hasId()) {
        return Seller.restore({
          id: 10,
          userId: seller.getUserId(),
          kind: seller.getKind(),
          shopName: seller.getShopName(),
          workplacePhone: seller.getWorkplacePhone(),
          province: seller.getProvince(),
          city: seller.getCity(),
          postalCode: seller.getPostalCode(),
          salesType: seller.getSalesType(),
          address: seller.getAddress(),
          industryType: seller.getIndustryType(),
          category: seller.getCategory(),
          activityType: seller.getActivityType(),
          documentType: seller.getDocumentType(),
          documentKey: seller.getDocumentKey(),
          status: seller.getStatus(),
        });
      }
      return seller;
    }),
  };

  const useCase = new SignupSellerUseCase(sellers);

  beforeEach(() => jest.clearAllMocks());

  it('creates a PENDING seller without issuing a JWT', async () => {
    sellers.findByUserId.mockResolvedValue(null);

    const summary = await useCase.execute({
      userId: 5,
      kind: SellerKind.RETAIL,
      industryType: 'FOOD',
      category: 'CANNED',
      activityType: 'STORE',
      documentType: 'NATIONAL_ID',
      documentKey: 'signup/doc.pdf',
    });

    expect(summary.status).toBe(SellerStatus.PENDING);
    expect(summary.shopName).toBeNull();
    expect(summary.profileComplete).toBe(false);
  });

  it('rejects a second seller profile', async () => {
    sellers.findByUserId.mockResolvedValue(
      Seller.restore({
        id: 1,
        userId: 5,
        kind: SellerKind.RETAIL,
        shopName: null,
        workplacePhone: null,
        province: null,
        city: null,
        postalCode: null,
        salesType: null,
        address: null,
        industryType: 'FOOD',
        category: 'CANNED',
        activityType: 'STORE',
        documentType: 'NATIONAL_ID' as never,
        documentKey: 'key',
        status: SellerStatus.PENDING,
      }),
    );

    await expect(
      useCase.execute({
        userId: 5,
        kind: SellerKind.BOTH,
        industryType: 'FOOD',
        category: 'CANNED',
        activityType: 'STORE',
        documentType: 'NATIONAL_ID',
        documentKey: 'key',
      }),
    ).rejects.toBeInstanceOf(SellerAlreadyExistsError);
  });
});
