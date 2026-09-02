import PhoneAlreadyRegisteredError from '../../errors/phone-already-registered.error';
import User from '../../model/user.model';
import SignupUserCommand from '../commands/signup-user.command';
import SignupUserUseCase from './signup-user.usecase';

describe('SignupUserUseCase', () => {
  const users = {
    findByPhone: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  };
  const pending = { save: jest.fn(), find: jest.fn(), delete: jest.fn() };
  const otp = { issue: jest.fn(), verify: jest.fn() };
  const sms = { send: jest.fn() };

  const useCase = new SignupUserUseCase(
    users,
    pending,
    otp,
    sms,
  );

  beforeEach(() => jest.clearAllMocks());

  it('stores pending name and sends OTP', async () => {
    users.findByPhone.mockResolvedValue(null);
    otp.issue.mockResolvedValue({ ok: true, code: '123456' });

    await expect(
      useCase.execute(new SignupUserCommand('Ali Rezaei', '+989123456789')),
    ).resolves.toEqual({ otpSent: true });

    expect(pending.save).toHaveBeenCalledWith('09123456789', 'Ali Rezaei');
    expect(sms.send).toHaveBeenCalledWith(
      '09123456789',
      'Virashops code: 123456',
    );
  });

  it('rejects an existing phone', async () => {
    users.findByPhone.mockResolvedValue(
      User.createBuyer('09123456789', 'Ali'),
    );

    await expect(
      useCase.execute(new SignupUserCommand('Ali', '09123456789')),
    ).rejects.toBeInstanceOf(PhoneAlreadyRegisteredError);
    expect(otp.issue).not.toHaveBeenCalled();
  });
});
