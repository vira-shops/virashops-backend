import User from '../../../domain/model/user.model';
import { SellerSummary } from '../../../domain/ports/seller-summary.query.port';
import AuthSession, {
  AuthOrStep2,
  SignupStep2Required,
} from '../../../domain/view-models/auth-session.view-model';

export type AuthUserHttpView = {
  id: number;
  phone: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  accountStatus: string;
  phoneVerified: boolean;
  activityType: string | null;
  guildType: string | null;
  seller: {
    id: number;
    kind: string;
    status: string;
    shopName: string | null;
    profileComplete: boolean;
  } | null;
};

export type SignupStep2RequiredHttpView = {
  needsStep2: true;
  phone: string;
  firstName: string;
  lastName: string;
};

export type VerifyOtpResponse =
  { accessToken: string; user: AuthUserHttpView } | SignupStep2RequiredHttpView;

export default class AuthHttpMapper {
  static toUser(
    user: User,
    seller: SellerSummary | null = null,
  ): AuthUserHttpView {
    return {
      id: user.getId(),
      phone: user.getPhone(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      fullName: user.getFullName(),
      roles: user.getRoles(),
      accountStatus: user.getStatus(),
      phoneVerified: user.isPhoneVerified(),
      activityType: user.getActivityType(),
      guildType: user.getGuildType(),
      seller: seller
        ? {
            id: seller.id,
            kind: seller.kind,
            status: seller.status,
            shopName: seller.shopName,
            profileComplete: seller.profileComplete,
          }
        : null,
    };
  }

  static toSession(session: AuthSession): {
    accessToken: string;
    user: AuthUserHttpView;
  } {
    return {
      accessToken: session.accessToken,
      user: AuthHttpMapper.toUser(session.user, session.seller),
    };
  }

  static toVerifyOtpResponse(result: AuthOrStep2): VerifyOtpResponse {
    if (result instanceof SignupStep2Required) {
      return {
        needsStep2: true,
        phone: result.phone,
        firstName: result.firstName,
        lastName: result.lastName,
      };
    }
    return AuthHttpMapper.toSession(result);
  }
}
