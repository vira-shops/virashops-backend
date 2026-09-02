import Role from '../../../../users/domain/model/enums/role.enum';
import SellerStatus from '../../model/enums/seller-status.enum';

export default class UpdateSellerStatusCommand {
  constructor(
    readonly sellerId: number,
    readonly status: SellerStatus,
    readonly actorRoles: Role[],
  ) {}
}
