import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import InvalidSellerStatusTransitionError from '../../errors/invalid-seller-status-transition.error';
import SalesType from '../../model/enums/sales-type.enum';
import SellerDocumentType from '../../model/enums/seller-document-type.enum';
import SellerKind from '../../model/enums/seller-kind.enum';
import SellerStatus from '../../model/enums/seller-status.enum';
import Seller from '../../model/seller.model';
import UpdateSellerStatusCommand from '../commands/update-seller-status.command';
import UpdateSellerStatusUseCase from './update-seller-status.usecase';

describe('UpdateSellerStatusUseCase', () => {
  const pending = Seller.restore({
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
    documentType: SellerDocumentType.NATIONAL_ID,
    documentKey: 'key',
    status: SellerStatus.PENDING,
  });

  const sellers = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn(async (seller: Seller) => seller),
  };

  const useCase = new UpdateSellerStatusUseCase(sellers);

  beforeEach(() => {
    jest.clearAllMocks();
    sellers.findById.mockResolvedValue(
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
        documentType: pending.getDocumentType(),
        documentKey: pending.getDocumentKey(),
        status: SellerStatus.PENDING,
      }),
    );
  });

  it('lets admin activate a pending seller', async () => {
    const seller = await useCase.execute(
      new UpdateSellerStatusCommand(1, SellerStatus.ACTIVE, [Role.ADMIN]),
    );
    expect(seller.getStatus()).toBe(SellerStatus.ACTIVE);
  });

  it('rejects non-admin actors', async () => {
    await expect(
      useCase.execute(
        new UpdateSellerStatusCommand(1, SellerStatus.ACTIVE, [Role.USER]),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects an illegal transition', async () => {
    await expect(
      useCase.execute(
        new UpdateSellerStatusCommand(1, SellerStatus.SUSPENDED, [
          Role.ADMIN,
        ]),
      ),
    ).rejects.toBeInstanceOf(InvalidSellerStatusTransitionError);
  });
});
