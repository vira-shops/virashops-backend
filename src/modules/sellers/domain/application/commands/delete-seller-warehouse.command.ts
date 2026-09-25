export default class DeleteSellerWarehouseCommand {
  constructor(
    readonly userId: number,
    readonly warehouseId: number,
  ) {}
}
