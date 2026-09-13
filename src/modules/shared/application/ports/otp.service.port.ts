export type IssueOtpResult =
  { ok: true; code: string } | { ok: false; reason: 'RATE_LIMITED' };

export type VerifyOtpResult =
  { ok: true } | { ok: false; reason: 'INVALID' | 'EXPIRED' };

export default interface OtpServicePort {
  issue(phone: string): Promise<IssueOtpResult>;
  verify(phone: string, code: string): Promise<VerifyOtpResult>;
}
