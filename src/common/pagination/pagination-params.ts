export default class PaginationParams {
  constructor(
    public readonly page: number,
    public readonly limit: number,
  ) {}

  static from(page?: number, limit?: number): PaginationParams {
    return new PaginationParams(page ?? 1, limit ?? 20);
  }

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
