export default class CreateAddressCommand {
  constructor(
    readonly userId: number,
    readonly label: string,
    readonly line1: string,
    readonly line2: string | null,
    readonly city: string,
    readonly province: string,
    readonly postalCode: string | null,
    readonly isDefault: boolean,
  ) {}
}
