export default class CreateSellerWarehouseCommand {
  constructor(
    readonly userId: number,
    readonly phone?: string | null,
    readonly postalCode?: string | null,
    readonly city?: string | null,
    readonly address?: string | null,
  ) {}
}
