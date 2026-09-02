import ForbiddenError from '../../errors/forbidden.error';
import SellerAlreadyExistsError from '../../errors/seller-already-exists.error';
import Role from '../../model/enums/role.enum';
import User from '../../model/user.model';
import EnsureUserForSellerCommand from '../commands/ensure-user-for-seller.command';
import EnsureUserForSellerUseCase from './ensure-user-for-seller.usecase';

describe('EnsureUserForSellerUseCase', () => {
  const users = {
    findByPhone: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(async (user: User) => {
      if (!user.hasId()) {
        user.assignPersistedId(3);
      }
      return user;
    }),
  };

  const useCase = new EnsureUserForSellerUseCase(users);

  beforeEach(() => jest.clearAllMocks());

  it('creates a user with USER and seller roles', async () => {
    users.findByPhone.mockResolvedValue(null);

    const user = await useCase.execute(
      new EnsureUserForSellerCommand(
        '09123456789',
        'Ali',
        Role.RETAIL_SELLER,
      ),
    );

    expect(user.getRoles()).toEqual([Role.USER, Role.RETAIL_SELLER]);
    expect(user.isPhoneVerified()).toBe(false);
  });

  it('attaches a seller role to an existing buyer', async () => {
    const buyer = User.restore({
      id: 2,
      phone: '09123456789',
      fullName: 'Ali',
      status: 'ACTIVE' as never,
      phoneVerifiedAt: new Date(),
      roles: [Role.USER],
    });
    users.findByPhone.mockResolvedValue(buyer);

    const user = await useCase.execute(
      new EnsureUserForSellerCommand(
        '09123456789',
        'Ali Shop',
        Role.WHOLESALE_SELLER,
      ),
    );

    expect(user.getRoles()).toEqual([Role.USER, Role.WHOLESALE_SELLER]);
  });

  it('rejects admin and existing sellers', async () => {
    users.findByPhone.mockResolvedValue(
      User.createAdmin('09123456789', 'Admin'),
    );
    await expect(
      useCase.execute(
        new EnsureUserForSellerCommand(
          '09123456789',
          'X',
          Role.RETAIL_SELLER,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);

    users.findByPhone.mockResolvedValue(
      User.createForSeller('09120000000', 'S', Role.RETAIL_SELLER),
    );
    await expect(
      useCase.execute(
        new EnsureUserForSellerCommand(
          '09120000000',
          'S',
          Role.WHOLESALE_SELLER,
        ),
      ),
    ).rejects.toBeInstanceOf(SellerAlreadyExistsError);
  });
});
