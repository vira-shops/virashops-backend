import PhoneAlreadyRegisteredError from '../../errors/phone-already-registered.error';
import InvalidSignupFieldError from '../../errors/invalid-signup-field.error';
import AccountType from '../../model/enums/account-type.enum';
import Channel from '../../model/enums/channel.enum';
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
  const files = { upload: jest.fn((key: string) => key) };

  const useCase = new SignupUserUseCase(
    users,
    pending,
    otp,
    sms,
    files as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('stores pending buyer draft and sends OTP', async () => {
    users.findByPhone.mockResolvedValue(null);
    otp.issue.mockResolvedValue({ ok: true, code: '123456' });

    await expect(
      useCase.execute(
        new SignupUserCommand(
          'Ali',
          'Rezaei',
          '+989123456789',
          Channel.RETAIL,
          AccountType.BUYER,
          'STORE',
          'FOOD',
          null,
          null,
          null,
          null,
        ),
      ),
    ).resolves.toEqual({ otpSent: true });

    expect(pending.save).toHaveBeenCalledWith('09123456789', {
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
    expect(sms.send).toHaveBeenCalledWith(
      '09123456789',
      'Virashops code: 123456',
    );
    expect(files.upload).not.toHaveBeenCalled();
  });

  it('uploads a document for seller signup and does not return a JWT', async () => {
    users.findByPhone.mockResolvedValue(null);
    otp.issue.mockResolvedValue({ ok: true, code: '123456' });

    const result = await useCase.execute(
      new SignupUserCommand(
        'Sara',
        'Seller',
        '09122222222',
        Channel.RETAIL,
        AccountType.SELLER,
        'STORE',
        null,
        'FOOD',
        'CANNED',
        'NATIONAL_ID',
        {
          buffer: Buffer.from('pdf'),
          mimeType: 'application/pdf',
          originalName: 'id.pdf',
        },
      ),
    );

    expect(result).toEqual({ otpSent: true });
    expect(files.upload).toHaveBeenCalled();
    expect(pending.save).toHaveBeenCalled();
  });

  it('rejects seller signup without a document', async () => {
    users.findByPhone.mockResolvedValue(null);
    await expect(
      useCase.execute(
        new SignupUserCommand(
          'Sara',
          'Seller',
          '09122222222',
          Channel.WHOLESALE,
          AccountType.BOTH,
          'STORE',
          null,
          'FOOD',
          'CANNED',
          null,
          null,
        ),
      ),
    ).rejects.toBeInstanceOf(InvalidSignupFieldError);
  });

  it('rejects an existing phone', async () => {
    users.findByPhone.mockResolvedValue(
      User.createBuyer('09123456789', 'Ali', 'Rezaei'),
    );

    await expect(
      useCase.execute(
        new SignupUserCommand(
          'Ali',
          'Rezaei',
          '09123456789',
          Channel.RETAIL,
          AccountType.BUYER,
          'STORE',
          'FOOD',
          null,
          null,
          null,
          null,
        ),
      ),
    ).rejects.toBeInstanceOf(PhoneAlreadyRegisteredError);
    expect(otp.issue).not.toHaveBeenCalled();
  });
});
