import AccountNotFoundError from '../../errors/account-not-found.error';
import InvalidOtpError from '../../errors/invalid-otp.error';
import OtpExpiredError from '../../errors/otp-expired.error';
import AccountType from '../../model/enums/account-type.enum';
import Channel from '../../model/enums/channel.enum';
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
    save: jest.fn((user: User) => {
      if (!user.hasId()) {
        user.assignPersistedId(1);
      }
      return user;
    }),
  };
  const pending = { save: jest.fn(), find: jest.fn(), delete: jest.fn() };
  const otp = { issue: jest.fn(), verify: jest.fn() };
  const issueSession = {
    execute: jest.fn((user: User) => new AuthSession('jwt-token', user, null)),
  };
  const createSeller = { create: jest.fn() };

  const useCase = new VerifyOtpUseCase(
    users,
    pending,
    otp,
    issueSession as unknown as IssueSessionUseCase,
    createSeller,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a retail buyer from pending signup', async () => {
    otp.verify.mockResolvedValue({ ok: true });
    users.findByPhone.mockResolvedValue(null);
    pending.find.mockResolvedValue({
      firstName: 'Ali',
      lastName: 'Rezaei',
      channel: Channel.RETAIL,
      accountType: AccountType.BUYER,
      activityType: 'STORE',
      guildType: 'FOOD',
      industryType: null,
      category: null,
      documentType: null,
      documentKey: null,
    });

    const session = await useCase.execute(
      new VerifyOtpCommand('09123456789', '123456'),
    );

    expect(session.accessToken).toBe('jwt-token');
    expect(session.user.getRoles()).toEqual([Role.RETAIL_BUYER]);
    expect(session.user.isPhoneVerified()).toBe(true);
    expect(createSeller.create).not.toHaveBeenCalled();
    expect(pending.delete).toHaveBeenCalledWith('09123456789');
  });

  it('creates seller roles and a pending booth from signup', async () => {
    otp.verify.mockResolvedValue({ ok: true });
    users.findByPhone.mockResolvedValue(null);
    pending.find.mockResolvedValue({
      firstName: 'Sara',
      lastName: 'Seller',
      channel: Channel.WHOLESALE,
      accountType: AccountType.BOTH,
      activityType: 'STORE',
      guildType: null,
      industryType: 'FOOD',
      category: 'CANNED',
      documentType: 'NATIONAL_ID',
      documentKey: 'signup/key.pdf',
    });

    const session = await useCase.execute(
      new VerifyOtpCommand('09122222222', '123456'),
    );

    expect(session.user.getRoles()).toEqual([
      Role.WHOLESALE_BUYER,
      Role.RETAIL_SELLER,
      Role.WHOLESALE_SELLER,
    ]);
    expect(createSeller.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        kind: 'BOTH',
        documentKey: 'signup/key.pdf',
      }),
    );
  });

  it('logs in an existing user', async () => {
    const existing = User.restore({
      id: 7,
      phone: '09123456789',
      firstName: 'Ali',
      lastName: 'Rezaei',
      status: 'ACTIVE' as never,
      phoneVerifiedAt: null,
      roles: [Role.RETAIL_BUYER],
      activityType: 'STORE',
      guildType: 'FOOD',
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
