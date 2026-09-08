import AccountType from './enums/account-type.enum';
import Channel from './enums/channel.enum';
import Role from './enums/role.enum';

export default function rolesFromSignup(
  channel: Channel,
  accountType: AccountType,
): Role[] {
  const buyer =
    channel === Channel.WHOLESALE ? Role.WHOLESALE_BUYER : Role.RETAIL_BUYER;

  if (accountType === AccountType.BUYER) {
    return [buyer];
  }

  if (accountType === AccountType.BOTH) {
    return [buyer, Role.RETAIL_SELLER, Role.WHOLESALE_SELLER];
  }

  const seller =
    channel === Channel.WHOLESALE ? Role.WHOLESALE_SELLER : Role.RETAIL_SELLER;
  return [buyer, seller];
}

export function isSellerAccountType(accountType: AccountType): boolean {
  return accountType === AccountType.SELLER || accountType === AccountType.BOTH;
}

export function sellerKindFromSignup(
  channel: Channel,
  accountType: AccountType,
): 'RETAIL' | 'WHOLESALE' | 'BOTH' | null {
  if (accountType === AccountType.BUYER) {
    return null;
  }
  if (accountType === AccountType.BOTH) {
    return 'BOTH';
  }
  return channel === Channel.WHOLESALE ? 'WHOLESALE' : 'RETAIL';
}
