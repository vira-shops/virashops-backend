import AccountNotFoundError from '../../errors/account-not-found.error';
import InvalidOtpError from '../../errors/invalid-otp.error';
import OtpExpiredError from '../../errors/otp-expired.error';
import Role from '../../model/enums/role.enum';
import User from '../../model/user.model';
import AuthSession from '../../view-models/auth-session.view-model';
import VerifyOtpCommand from '../commands/verify-otp.command';
import IssueSessionUseCase from './issue-session.usecase';
import VerifyOtpUseCase from './verify-otp.usecase';

describe('VerifyOtpUseCase', () => {
  const users = {
    findByPhone: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(async (user: User) => {
      if (!user.hasId()) {
        user.assignPersistedId(1);
      }
      return user;
    }),
  };
  const pending = { save: jest.fn(), find: jest.fn(), delete: jest.fn() };
  const otp = { issue: jest.fn(), verify: jest.fn() };
  const issueSession = {
    execute: jest.fn(
      async (user: User) => new AuthSession('jwt-token', user, null),
    ),
  };

  const useCase = new VerifyOtpUseCase(
    users,
    pending,
    otp,
    issueSession as unknown as IssueSessionUseCase,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a USER from pending signup', async () => {
    otp.verify.mockResolvedValue({ ok: true });
    users.findByPhone.mockResolvedValue(null);
    pending.find.mockResolvedValue({ fullName: 'Ali Rezaei' });

    const session = await useCase.execute(
      new VerifyOtpCommand('09123456789', '123456'),
    );

    expect(session.accessToken).toBe('jwt-token');
    expect(session.user.getRoles()).toEqual([Role.USER]);
    expect(session.user.isPhoneVerified()).toBe(true);
    expect(pending.delete).toHaveBeenCalledWith('09123456789');
  });

  it('logs in an existing user', async () => {
    const existing = User.restore({
      id: 7,
      phone: '09123456789',
      fullName: 'Ali',
      status: 'ACTIVE' as never,
      phoneVerifiedAt: null,
      roles: [Role.USER],
    });
    otp.verify.mockResolvedValue({ ok: true });
    users.findByPhone.mockResolvedValue(existing);

    const session = await useCase.execute(
      new VerifyOtpCommand('09123456789', '123456'),
    );

    expect(session.user.getId()).toBe(7);
    expect(session.user.isPhoneVerified()).toBe(true);
  });

  it('rejects invalid and expired codes', async () => {
    otp.verify.mockResolvedValueOnce({ ok: false, reason: 'INVALID' });
    await expect(
      useCase.execute(new VerifyOtpCommand('09123456789', '000000')),
    ).rejects.toBeInstanceOf(InvalidOtpError);

    otp.verify.mockResolvedValueOnce({ ok: false, reason: 'EXPIRED' });
    await expect(
      useCase.execute(new VerifyOtpCommand('09123456789', '123456')),
    ).rejects.toBeInstanceOf(OtpExpiredError);
  });

  it('fails when OTP is valid but no account or pending signup exists', async () => {
    otp.verify.mockResolvedValue({ ok: true });
    users.findByPhone.mockResolvedValue(null);
    pending.find.mockResolvedValue(null);

    await expect(
      useCase.execute(new VerifyOtpCommand('09123456789', '123456')),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});
