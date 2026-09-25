import BuyerProfile from '../../model/buyer-profile.model';
import BuyerGender from '../../model/enums/buyer-gender.enum';
import BuyerIdentityType from '../../model/enums/buyer-identity-type.enum';
import User from '../../model/user.model';
import AccountStatus from '../../model/enums/account-status.enum';
import Role from '../../model/enums/role.enum';
import UpdateBuyerProfileCommand from '../commands/update-buyer-profile.command';
import UpdateBuyerProfileUseCase from './update-buyer-profile.usecase';

describe('UpdateBuyerProfileUseCase', () => {
  const user = User.restore({
    id: 1,
    phone: '09120000000',
    firstName: 'Hossein',
    lastName: 'Heidari',
    status: AccountStatus.ACTIVE,
    phoneVerifiedAt: new Date(),
    roles: [Role.WHOLESALE_BUYER],
    activityType: 'STORE',
    guildType: null,
  });
  const users = {
    findById: jest.fn(() => user),
    save: jest.fn((u: User) => u),
  };
  const profiles = {
    findByUserId: jest.fn(() => null),
    save: jest.fn((p: BuyerProfile) =>
      BuyerProfile.restore({ ...p.toSnapshot(), id: 5 }),
    ),
  };
  const useCase = new UpdateBuyerProfileUseCase(
    users as never,
    profiles as never,
  );

  it('updates personal and business fields', async () => {
    const view = await useCase.execute(
      new UpdateBuyerProfileCommand(
        1,
        'Hossein',
        'Heidari',
        '0012345678',
        '1990-01-01',
        BuyerGender.MALE,
        null,
        'Vira Shop',
        '02111111111',
        '1234567890',
        'Yazd',
        'Yazd',
        'Street 1',
        BuyerIdentityType.SUPERMARKET,
        'uploads/doc1.jpg',
        null,
      ),
    );
    expect(view.businessName).toBe('Vira Shop');
    expect(view.identityType).toBe(BuyerIdentityType.SUPERMARKET);
    expect(view.nationalId).toBe('0012345678');
    expect(view.gender).toBe(BuyerGender.MALE);
    expect(view.postalCode).toBe('1234567890');
  });
});
