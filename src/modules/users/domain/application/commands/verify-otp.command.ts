export default class VerifyOtpCommand {
  constructor(
    readonly phone: string,
    readonly code: string,
  ) {}
}
