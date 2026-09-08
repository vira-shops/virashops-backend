import InvalidPhoneError from '../errors/invalid-phone.error';

export default class Phone {
  private constructor(private readonly value: string) {}

  static parse(raw: string): Phone {
    const digits = raw.replace(/\D/g, '');
    let normalized = digits;

    if (normalized.startsWith('0098')) {
      normalized = `0${normalized.slice(4)}`;
    } else if (normalized.startsWith('98') && normalized.length >= 12) {
      normalized = `0${normalized.slice(2)}`;
    } else if (normalized.startsWith('9') && normalized.length === 10) {
      normalized = `0${normalized}`;
    }

    if (!/^09\d{9}$/.test(normalized)) {
      throw new InvalidPhoneError();
    }

    return new Phone(normalized);
  }

  toString(): string {
    return this.value;
  }
}
