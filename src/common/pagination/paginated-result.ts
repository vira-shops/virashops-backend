import PaginationParams from './pagination-params';

export default class PaginatedResult<T> {
  constructor(
    public readonly items: T[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}

  get pageCount(): number {
    return Math.ceil(this.total / this.limit) || 0;
  }

  static of<T>(
    items: T[],
    total: number,
    params: PaginationParams,
  ): PaginatedResult<T> {
    return new PaginatedResult(items, total, params.page, params.limit);
  }
}
