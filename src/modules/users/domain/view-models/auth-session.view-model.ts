import User from '../model/user.model';
import type { SellerSummary } from '../ports/seller-summary.query.port';

export default class AuthSession {
  constructor(
    readonly accessToken: string,
    readonly user: User,
    readonly seller: SellerSummary | null,
  ) {}
}
