import { ConfigService } from '@nestjs/config';
import PasswordHasherAdapter from './password-hasher.adapter';

describe('PasswordHasherAdapter', () => {
  const hasher = new PasswordHasherAdapter({
    get: () => 4,
  } as unknown as ConfigService);

  it('hashes a password and compares it', async () => {
    const hash = await hasher.hash('secret');

    expect(hash).not.toBe('secret');
    await expect(hasher.compare('secret', hash)).resolves.toBe(true);
    await expect(hasher.compare('wrong', hash)).resolves.toBe(false);
  });
});
