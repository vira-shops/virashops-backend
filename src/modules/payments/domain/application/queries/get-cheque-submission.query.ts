export default class GetChequeSubmissionQuery {
  constructor(
    public readonly userId: number,
    public readonly paymentId: number,
  ) {}
}
