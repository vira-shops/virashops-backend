import AccountInactiveError from '../../errors/account-inactive.error';
import AccountNotFoundError from '../../errors/account-not-found.error';
import AccountStatus from '../../model/enums/account-status.enum';
import AccountType from '../../model/enums/account-type.enum';
import Channel from '../../model/enums/channel.enum';
import Role from '../../model/enums/role.enum';
import User from '../../model/user.model';
import RequestOtpCommand from '../commands/request-otp.command';
import RequestOtpUseCase from './request-otp.usecase';

describe('RequestOtpUseCase', () => {
  const users = {
    findByPhone: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  };
  const pending = { save: jest.fn(), find: jest.fn(), delete: jest.fn() };
  const otp = { issue: jest.fn(), verify: jest.fn() };
  const sms = { send: jest.fn() };
  const useCase = new RequestOtpUseCase(users, otp, sms, pending);

  beforeEach(() => jest.clearAllMocks());

  it('sends OTP for an existing active user', async () => {
    users.findByPhone.mockResolvedValue(
      User.createBuyer('09123456789', 'Ali', 'Rezaei'),
    );
    otp.issue.mockResolvedValue({ ok: true, code: '111111' });

    await expect(
      useCase.execute(new RequestOtpCommand('09123456789')),
    ).resolves.toEqual({ otpSent: true });
    expect(sms.send).toHaveBeenCalled();
  });

  it('resends OTP when a pending signup exists', async () => {
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
    otp.issue.mockResolvedValue({ ok: true, code: '111111' });

    await expect(
      useCase.execute(new RequestOtpCommand('09123456789')),
    ).resolves.toEqual({ otpSent: true });
  });

  it('returns not found when no user or pending signup exists', async () => {
    users.findByPhone.mockResolvedValue(null);
    pending.find.mockResolvedValue(null);
    await expect(
      useCase.execute(new RequestOtpCommand('09123456789')),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });

  it('rejects inactive accounts', async () => {
    users.findByPhone.mockResolvedValue(
      User.restore({
        id: 1,
        phone: '09123456789',
        firstName: 'Ali',
        lastName: 'Rezaei',
        status: AccountStatus.SUSPENDED,
        phoneVerifiedAt: new Date(),
        roles: [Role.RETAIL_BUYER],
        activityType: null,
        guildType: null,
      }),
    );
    await expect(
      useCase.execute(new RequestOtpCommand('09123456789')),
    ).rejects.toBeInstanceOf(AccountInactiveError);
  });
});
