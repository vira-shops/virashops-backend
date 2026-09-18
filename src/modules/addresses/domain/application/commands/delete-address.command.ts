export default class DeleteAddressCommand {
  constructor(
    readonly userId: number,
    readonly addressId: number,
  ) {}
}
