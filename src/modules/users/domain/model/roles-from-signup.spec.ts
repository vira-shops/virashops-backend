import rolesFromSignup, { isSellerAccountType } from './roles-from-signup';
import AccountType from './enums/account-type.enum';
import Channel from './enums/channel.enum';
import Role from './enums/role.enum';

describe('rolesFromSignup', () => {
  it('maps buyer by channel', () => {
    expect(rolesFromSignup(Channel.RETAIL, AccountType.BUYER)).toEqual([
      Role.RETAIL_BUYER,
    ]);
    expect(rolesFromSignup(Channel.WHOLESALE, AccountType.BUYER)).toEqual([
      Role.WHOLESALE_BUYER,
    ]);
  });

  it('maps seller by channel and always includes the channel buyer role', () => {
    expect(rolesFromSignup(Channel.RETAIL, AccountType.SELLER)).toEqual([
      Role.RETAIL_BUYER,
      Role.RETAIL_SELLER,
    ]);
    expect(rolesFromSignup(Channel.WHOLESALE, AccountType.SELLER)).toEqual([
      Role.WHOLESALE_BUYER,
      Role.WHOLESALE_SELLER,
    ]);
  });

  it('maps both to channel buyer plus both seller roles', () => {
    expect(rolesFromSignup(Channel.RETAIL, AccountType.BOTH)).toEqual([
      Role.RETAIL_BUYER,
      Role.RETAIL_SELLER,
      Role.WHOLESALE_SELLER,
    ]);
    expect(rolesFromSignup(Channel.WHOLESALE, AccountType.BOTH)).toEqual([
      Role.WHOLESALE_BUYER,
      Role.RETAIL_SELLER,
      Role.WHOLESALE_SELLER,
    ]);
  });

  it('detects seller account types', () => {
    expect(isSellerAccountType(AccountType.BUYER)).toBe(false);
    expect(isSellerAccountType(AccountType.SELLER)).toBe(true);
    expect(isSellerAccountType(AccountType.BOTH)).toBe(true);
  });
});
