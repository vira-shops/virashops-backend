import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import AuthSession from '../../../../users/domain/view-models/auth-session.view-model';
import SalesType from '../../model/enums/sales-type.enum';
import SellerDocumentType from '../../model/enums/seller-document-type.enum';
import SellerKind from '../../model/enums/seller-kind.enum';
import SellerStatus from '../../model/enums/seller-status.enum';
import Seller from '../../model/seller.model';
import SignupSellerCommand from '../commands/signup-seller.command';
import SignupSellerUseCase from './signup-seller.usecase';

describe('SignupSellerUseCase', () => {
  const sellers = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn(async (seller: Seller) => {
      if (!seller.hasId()) {
        return Seller.restore({
          ...sellerAsProps(seller),
          id: 10,
        });
      }
      return seller;
    }),
  };
  const files = { upload: jest.fn(async (key: string) => key) };
  const ensureUser = {
    execute: jest.fn(),
  };
  const issueSession = {
    execute: jest.fn(
      async (user: User, seller: { status: string } | null) =>
        new AuthSession('seller-jwt', user, seller as never),
    ),
  };

  const useCase = new SignupSellerUseCase(
    sellers,
    files,
    ensureUser as never,
    issueSession as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a PENDING seller without OTP and issues a JWT', async () => {
    const user = User.restore({
      id: 5,
      phone: '09123456789',
      fullName: 'Ali',
      status: 'ACTIVE' as never,
      phoneVerifiedAt: null,
      roles: [Role.USER, Role.RETAIL_SELLER],
    });
    ensureUser.execute.mockResolvedValue(user);
    sellers.findByUserId.mockResolvedValue(null);

    const session = await useCase.execute(
      new SignupSellerCommand(
        SellerKind.RETAIL,
        'Ali',
        '09123456789',
        'Vira Shop',
        null,
        'Tehran',
        'Tehran',
        '1234567890',
        SalesType.SUPERMARKET,
        'Valiasr St',
        SellerDocumentType.BUSINESS_LICENSE,
        {
          buffer: Buffer.from('pdf'),
          mimeType: 'application/pdf',
          originalName: 'license.pdf',
        },
      ),
    );

    expect(session.accessToken).toBe('seller-jwt');
    expect(session.user.getRoles()).toEqual([
      Role.USER,
      Role.RETAIL_SELLER,
    ]);
    expect(files.upload).toHaveBeenCalled();
    const saved: Seller = await sellers.save.mock.results[0].value;
    expect(saved.getStatus()).toBe(SellerStatus.PENDING);
  });
});

function sellerAsProps(seller: Seller) {
  return {
    userId: seller.getUserId(),
    kind: seller.getKind(),
    shopName: seller.getShopName(),
    workplacePhone: seller.getWorkplacePhone(),
    province: seller.getProvince(),
    city: seller.getCity(),
    postalCode: seller.getPostalCode(),
    salesType: seller.getSalesType(),
    address: seller.getAddress(),
    documentType: seller.getDocumentType(),
    documentKey: seller.getDocumentKey(),
    status: seller.getStatus(),
  };
}
