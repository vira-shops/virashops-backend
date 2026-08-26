import PaginationParams from './pagination-params';
import PaginatedResult from './paginated-result';

describe('PaginationParams', () => {
  it('defaults to page 1 and limit 20', () => {
    const params = PaginationParams.from();

    expect(params.page).toBe(1);
    expect(params.limit).toBe(20);
    expect(params.skip).toBe(0);
  });

  it('computes skip from page and limit', () => {
    const params = PaginationParams.from(3, 10);

    expect(params.skip).toBe(20);
  });
});

describe('PaginatedResult', () => {
  it('computes pageCount', () => {
    const result = PaginatedResult.of(
      ['a', 'b'],
      25,
      PaginationParams.from(1, 10),
    );

    expect(result.pageCount).toBe(3);
    expect(result.items).toEqual(['a', 'b']);
    expect(result.total).toBe(25);
  });
});
