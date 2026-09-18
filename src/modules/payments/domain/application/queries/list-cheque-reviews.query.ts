import Role from '../../../../users/domain/model/enums/role.enum';
import ChequeVerificationStatus from '../../model/enums/cheque-verification-status.enum';

export default class ListChequeReviewsQuery {
  constructor(
    public readonly actorRoles: Role[],
    public readonly status: ChequeVerificationStatus | null = null,
  ) {}
}
