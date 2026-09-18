import ChequeCadence from '../../model/enums/cheque-cadence.enum';
import type { ChequePlanItem } from '../../model/cheque-submission.model';

export default class SubmitChequeVerificationCommand {
  constructor(
    public readonly userId: number,
    public readonly paymentId: number,
    public readonly fullName: string,
    public readonly accountNumber: string,
    public readonly nationalId: string,
    public readonly branchCode: string,
    public readonly photoKeysOrUrls: string[],
    public readonly cadence: ChequeCadence | null = null,
    public readonly downPayment: number | null = null,
    public readonly planItems: ChequePlanItem[] = [],
  ) {}
}
