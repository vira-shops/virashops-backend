import Role from '../../../../users/domain/model/enums/role.enum';

export default class ApproveChequePaymentCommand {
  constructor(
    public readonly paymentId: number,
    public readonly adminUserId: number,
    public readonly actorRoles: Role[],
  ) {}
}
