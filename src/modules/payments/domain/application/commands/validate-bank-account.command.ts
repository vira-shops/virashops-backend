export default class ValidateBankAccountCommand {
  constructor(
    public readonly userId: number,
    public readonly fullName: string,
    public readonly accountNumber: string,
    public readonly nationalId: string,
    public readonly branchCode: string,
  ) {}
}
