import AccountType from '../../model/enums/account-type.enum';
import Channel from '../../model/enums/channel.enum';

export type SignupDocumentPayload = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
};

export default class SignupUserCommand {
  constructor(
    readonly firstName: string,
    readonly lastName: string,
    readonly phone: string,
    readonly channel: Channel,
    readonly accountType: AccountType,
    readonly activityType: string | null,
    readonly guildType: string | null,
    readonly industryType: string | null,
    readonly category: string | null,
    readonly documentType: string | null,
    readonly document: SignupDocumentPayload | null,
  ) {}
}

export class SignupStep1Command {
  constructor(
    readonly firstName: string,
    readonly lastName: string,
    readonly phone: string,
  ) {}
}

export class SignupStep2Command {
  constructor(
    readonly phone: string,
    readonly channel: Channel,
    readonly accountType: AccountType,
    readonly activityType: string | null,
    readonly guildType: string | null,
    readonly industryType: string | null,
    readonly category: string | null,
    readonly documentType: string | null,
    readonly document: SignupDocumentPayload | null,
  ) {}
}
