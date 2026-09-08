import AccountType from '../model/enums/account-type.enum';
import Channel from '../model/enums/channel.enum';

export type PendingSignupDraft = {
  firstName: string;
  lastName: string;
  channel: Channel;
  accountType: AccountType;
  activityType: string | null;
  guildType: string | null;
  industryType: string | null;
  category: string | null;
  documentType: string | null;
  documentKey: string | null;
};

export default interface PendingSignupRepositoryPort {
  save(phone: string, draft: PendingSignupDraft): Promise<void>;
  find(phone: string): Promise<PendingSignupDraft | null>;
  delete(phone: string): Promise<void>;
}
