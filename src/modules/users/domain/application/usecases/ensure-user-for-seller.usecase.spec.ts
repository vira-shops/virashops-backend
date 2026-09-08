import ForbiddenError from '../../errors/forbidden.error';
import Role from '../../model/enums/role.enum';
import User from '../../model/user.model';
import EnsureUserForSellerCommand from '../commands/ensure-user-for-seller.command';
import EnsureUserForSellerUseCase from './ensure-user-for-seller.usecase';

describe('EnsureUserForSellerUseCase', () => {
  const users = {
    findByPhone: jest.fn(),
    findById: jest.fn(),
    save: jest.fn((user: User) => {
      if (!user.hasId()) {
        user.assignPersistedId(3);
      }
      return user;
    }),
  };

  const useCase = new EnsureUserForSellerUseCase(users);

  beforeEach(() => jest.clearAllMocks());

  it('creates a user with buyer and seller roles', async () => {
    users.findByPhone.mockResolvedValue(null);

    const user = await useCase.execute(
      new EnsureUserForSellerCommand(
        '09123456789',
        'Ali',
        'Rezaei',
        Role.RETAIL_SELLER,
      ),
    );

    expect(user.getRoles()).toEqual([Role.RETAIL_BUYER, Role.RETAIL_SELLER]);
    expect(user.isPhoneVerified()).toBe(true);
  });

  it('attaches a seller role to an existing buyer', async () => {
    const buyer = User.restore({
      id: 2,
      phone: '09123456789',
      firstName: 'Ali',
      lastName: 'Rezaei',
      status: 'ACTIVE' as never,
      phoneVerifiedAt: new Date(),
      roles: [Role.RETAIL_BUYER],
      activityType: null,
      guildType: null,
    });
    users.findByPhone.mockResolvedValue(buyer);

    const user = await useCase.execute(
      new EnsureUserForSellerCommand(
        '09123456789',
        'Ali',
        'Shop',
        Role.WHOLESALE_SELLER,
      ),
    );

    expect(user.getRoles()).toEqual([Role.RETAIL_BUYER, Role.WHOLESALE_SELLER]);
  });

  it('rejects admin accounts', async () => {
    users.findByPhone.mockResolvedValue(
      User.createAdmin('09123456789', 'Admin'),
    );
    await expect(
      useCase.execute(
        new EnsureUserForSellerCommand(
          '09123456789',
          'X',
          'Y',
          Role.RETAIL_SELLER,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
