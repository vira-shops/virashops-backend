import BuyerGender from '../../model/enums/buyer-gender.enum';
import BuyerIdentityType from '../../model/enums/buyer-identity-type.enum';

export default class UpdateBuyerProfileCommand {
  constructor(
    readonly userId: number,
    readonly firstName?: string,
    readonly lastName?: string,
    readonly nationalId?: string | null,
    readonly dateOfBirth?: string | null,
    readonly gender?: BuyerGender | null,
    readonly avatarKey?: string | null,
    readonly businessName?: string | null,
    readonly businessPhone?: string | null,
    readonly postalCode?: string | null,
    readonly province?: string | null,
    readonly city?: string | null,
    readonly address?: string | null,
    readonly identityType?: BuyerIdentityType | null,
    readonly documentKey1?: string | null,
    readonly documentKey2?: string | null,
  ) {}
}
