import AccountType from '../model/enums/account-type.enum';
import Channel from '../model/enums/channel.enum';

export type PendingSignupDraft = {
  firstName: string;
  lastName: string;
  channel?: Channel | null | undefined;
  accountType?: AccountType | null | undefined;
  activityType?: string | null | undefined;
  guildType?: string | null | undefined;
  industryType?: string | null | undefined;
  category?: string | null | undefined;
  documentType?: string | null | undefined;
  documentKey?: string | null | undefined;
  step?: 1 | 2 | null | undefined;
};

export default interface PendingSignupRepositoryPort {
  save(phone: string, draft: PendingSignupDraft): Promise<void>;
  find(phone: string): Promise<PendingSignupDraft | null>;
  delete(phone: string): Promise<void>;
}
