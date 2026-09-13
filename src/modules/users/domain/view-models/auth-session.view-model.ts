import User from '../model/user.model';
import type { SellerSummary } from '../ports/seller-summary.query.port';

export default class AuthSession {
  constructor(
    readonly accessToken: string,
    readonly user: User,
    readonly seller: SellerSummary | null,
  ) {}
}

export class SignupStep2Required {
  constructor(
    readonly phone: string,
    readonly firstName: string,
    readonly lastName: string,
  ) {}
}

export type AuthOrStep2 = AuthSession | SignupStep2Required;
