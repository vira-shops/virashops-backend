import InvalidPhoneError from '../errors/invalid-phone.error';
import Phone from './phone';

describe('Phone', () => {
  it('normalizes Iranian mobile formats', () => {
    expect(Phone.parse('09123456789').toString()).toBe('09123456789');
    expect(Phone.parse('+989123456789').toString()).toBe('09123456789');
    expect(Phone.parse('989123456789').toString()).toBe('09123456789');
    expect(Phone.parse('9123456789').toString()).toBe('09123456789');
  });

  it('rejects invalid numbers', () => {
    expect(() => Phone.parse('02112345678')).toThrow(InvalidPhoneError);
    expect(() => Phone.parse('123')).toThrow(InvalidPhoneError);
  });
});
