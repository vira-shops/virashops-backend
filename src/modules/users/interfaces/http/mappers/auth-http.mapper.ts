import User from '../../../domain/model/user.model';
import { SellerSummary } from '../../../domain/ports/seller-summary.query.port';
import AuthSession from '../../../domain/view-models/auth-session.view-model';

export type AuthUserHttpView = {
  id: number;
  phone: string;
  fullName: string;
  roles: string[];
  accountStatus: string;
  phoneVerified: boolean;
  seller: {
    id: number;
    kind: string;
    status: string;
    shopName: string;
  } | null;
};

export default class AuthHttpMapper {
  static toUser(
    user: User,
    seller: SellerSummary | null = null,
  ): AuthUserHttpView {
    return {
      id: user.getId(),
      phone: user.getPhone(),
      fullName: user.getFullName(),
      roles: user.getRoles(),
      accountStatus: user.getStatus(),
      phoneVerified: user.isPhoneVerified(),
      seller: seller
        ? {
            id: seller.id,
            kind: seller.kind,
            status: seller.status,
            shopName: seller.shopName,
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
}
