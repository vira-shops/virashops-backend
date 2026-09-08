import Role from '../../model/enums/role.enum';

export default class EnsureUserForSellerCommand {
  constructor(
    readonly phone: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly sellerRole: Role.RETAIL_SELLER | Role.WHOLESALE_SELLER,
  ) {}
}
