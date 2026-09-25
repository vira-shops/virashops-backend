export default class UpdateAddressCommand {
  constructor(
    readonly userId: number,
    readonly addressId: number,
    readonly label: string,
    readonly line1: string,
    readonly line2: string | null,
    readonly city: string,
    readonly province: string,
    readonly postalCode: string | null,
    readonly recipientFullName: string,
    readonly recipientPhone: string,
    readonly nationalId: string,
    readonly houseNumber: string,
    readonly isDefault: boolean,
  ) {}
}
