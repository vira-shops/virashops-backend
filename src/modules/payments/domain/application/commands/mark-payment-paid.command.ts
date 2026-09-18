export default class MarkPaymentPaidCommand {
  constructor(
    readonly userId: number,
    readonly paymentId: number,
  ) {}
}
