import SellerGender from '../../model/enums/seller-gender.enum';

export default class UpdateRetailSellerProfileCommand {
  constructor(
    readonly userId: number,
    readonly firstName?: string,
    readonly lastName?: string,
    readonly email?: string | null,
    readonly nationalId?: string | null,
    readonly dateOfBirth?: string | null,
    readonly gender?: SellerGender | null,
    readonly province?: string | null,
    readonly city?: string | null,
    readonly occupation?: string | null,
    readonly address?: string | null,
    readonly postalCode?: string | null,
    readonly latitude?: number | null,
    readonly longitude?: number | null,
    readonly avatarKey?: string | null,
  ) {}
}
