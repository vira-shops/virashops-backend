import { isValidIranianNationalId } from './iranian-national-id';

describe('isValidIranianNationalId', () => {
  it('accepts a valid national id', () => {
    expect(isValidIranianNationalId('0013542419')).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(isValidIranianNationalId('123')).toBe(false);
  });

  it('rejects all identical digits', () => {
    expect(isValidIranianNationalId('0000000000')).toBe(false);
  });

  it('rejects invalid check digit', () => {
    expect(isValidIranianNationalId('0013542418')).toBe(false);
  });
});
