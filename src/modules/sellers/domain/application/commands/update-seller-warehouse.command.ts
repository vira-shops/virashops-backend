export default class UpdateSellerWarehouseCommand {
  constructor(
    readonly userId: number,
    readonly warehouseId: number,
    readonly phone?: string | null,
    readonly postalCode?: string | null,
    readonly city?: string | null,
    readonly address?: string | null,
  ) {}
}
