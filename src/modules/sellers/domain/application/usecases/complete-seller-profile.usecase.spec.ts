import InvalidSellerFieldError from '../../errors/invalid-seller-field.error';
import SalesType from '../../model/enums/sales-type.enum';
import SellerDocumentType from '../../model/enums/seller-document-type.enum';
import SellerKind from '../../model/enums/seller-kind.enum';
import SellerStatus from '../../model/enums/seller-status.enum';
import Seller from '../../model/seller.model';
import CompleteSellerProfileCommand from '../commands/complete-seller-profile.command';
import CompleteSellerProfileUseCase from './complete-seller-profile.usecase';

describe('CompleteSellerProfileUseCase', () => {
  const pending = Seller.restore({
    id: 1,
    userId: 5,
    kind: SellerKind.BOTH,
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
    documentType: SellerDocumentType.BUSINESS_LICENSE,
    documentKey: 'key',
    nationalId: null,
    dateOfBirth: null,
    gender: null,
    avatarKey: null,
    status: SellerStatus.PENDING,
  });

  const sellers = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn((seller: Seller) => seller),
  };

  const useCase = new CompleteSellerProfileUseCase(sellers);

  beforeEach(() => {
    jest.clearAllMocks();
    sellers.findByUserId.mockResolvedValue(
      Seller.restore({
        id: pending.getId(),
        userId: pending.getUserId(),
        kind: pending.getKind(),
        shopName: pending.getShopName(),
        workplacePhone: pending.getWorkplacePhone(),
        province: pending.getProvince(),
        city: pending.getCity(),
        postalCode: pending.getPostalCode(),
        salesType: pending.getSalesType(),
        address: pending.getAddress(),
        industryType: pending.getIndustryType(),
        category: pending.getCategory(),
        activityType: pending.getActivityType(),
        documentType: pending.getDocumentType(),
        documentKey: pending.getDocumentKey(),
        nationalId: pending.getNationalId(),
        dateOfBirth: pending.getDateOfBirth(),
        gender: pending.getGender(),
        avatarKey: pending.getAvatarKey(),
        status: pending.getStatus(),
      }),
    );
  });

  it('fills booth fields and marks the profile complete', async () => {
    const seller = await useCase.execute(
      new CompleteSellerProfileCommand(
        5,
        'Sara Shop',
        null,
        'Tehran',
        'Tehran',
        '1234567890',
        SalesType.STORE,
        'Valiasr',
      ),
    );
    expect(seller.isProfileComplete()).toBe(true);
    expect(seller.getShopName()).toBe('Sara Shop');
    expect(seller.getStatus()).toBe(SellerStatus.PENDING);
  });

  it('rejects an empty shop name', async () => {
    await expect(
      useCase.execute(
        new CompleteSellerProfileCommand(
          5,
          '  ',
          null,
          'Tehran',
          'Tehran',
          null,
          SalesType.STORE,
          'Valiasr',
        ),
      ),
    ).rejects.toBeInstanceOf(InvalidSellerFieldError);
  });
});
