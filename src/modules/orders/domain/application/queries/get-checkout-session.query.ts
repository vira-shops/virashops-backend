export default class GetCheckoutSessionQuery {
  constructor(
    readonly userId: number,
    readonly sessionId: number,
  ) {}
}
