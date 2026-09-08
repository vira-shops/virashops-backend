import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import InvalidSellerStatusTransitionError from '../../errors/invalid-seller-status-transition.error';
import SellerProfileIncompleteError from '../../errors/seller-profile-incomplete.error';
import SalesType from '../../model/enums/sales-type.enum';
import SellerDocumentType from '../../model/enums/seller-document-type.enum';
import SellerKind from '../../model/enums/seller-kind.enum';
import SellerStatus from '../../model/enums/seller-status.enum';
import Seller from '../../model/seller.model';
import UpdateSellerStatusCommand from '../commands/update-seller-status.command';
import UpdateSellerStatusUseCase from './update-seller-status.usecase';

describe('UpdateSellerStatusUseCase', () => {
  const complete = {
    id: 1,
    userId: 5,
    kind: SellerKind.RETAIL,
    shopName: 'Shop',
    workplacePhone: null,
    province: 'Tehran',
    city: 'Tehran',
    postalCode: null,
    salesType: SalesType.STORE,
    address: 'Addr',
    industryType: 'FOOD',
    category: 'CANNED',
    activityType: 'STORE',
    documentType: SellerDocumentType.NATIONAL_ID,
    documentKey: 'key',
    status: SellerStatus.PENDING,
  };

  const sellers = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn((seller: Seller) => seller),
  };

  const useCase = new UpdateSellerStatusUseCase(sellers);

  beforeEach(() => {
    jest.clearAllMocks();
    sellers.findById.mockResolvedValue(Seller.restore({ ...complete }));
  });

  it('lets admin activate a pending seller with a complete profile', async () => {
    const seller = await useCase.execute(
      new UpdateSellerStatusCommand(1, SellerStatus.ACTIVE, [Role.ADMIN]),
    );
    expect(seller.getStatus()).toBe(SellerStatus.ACTIVE);
  });

  it('rejects activation when the booth profile is incomplete', async () => {
    sellers.findById.mockResolvedValue(
      Seller.restore({
        ...complete,
        shopName: null,
        province: null,
        city: null,
        address: null,
        salesType: null,
      }),
    );
    await expect(
      useCase.execute(
        new UpdateSellerStatusCommand(1, SellerStatus.ACTIVE, [Role.ADMIN]),
      ),
    ).rejects.toBeInstanceOf(SellerProfileIncompleteError);
  });

  it('rejects non-admin actors', async () => {
    await expect(
      useCase.execute(
        new UpdateSellerStatusCommand(1, SellerStatus.ACTIVE, [
          Role.RETAIL_BUYER,
        ]),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects an illegal transition', async () => {
    await expect(
      useCase.execute(
        new UpdateSellerStatusCommand(1, SellerStatus.SUSPENDED, [Role.ADMIN]),
      ),
    ).rejects.toBeInstanceOf(InvalidSellerStatusTransitionError);
  });
});
