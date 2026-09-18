import Role from '../../../../users/domain/model/enums/role.enum';
import ChequeRejectionReason from '../../model/enums/cheque-rejection-reason.enum';

export default class RejectChequePaymentCommand {
  constructor(
    public readonly paymentId: number,
    public readonly adminUserId: number,
    public readonly actorRoles: Role[],
    public readonly reasons: ChequeRejectionReason[],
    public readonly note: string | null = null,
  ) {}
}
