export type BankAccountValidationView = {
  id: number;
  fullName: string;
  accountNumber: string;
  nationalId: string;
  branchCode: string;
  creditGrade: string | null;
  creditCeiling: number | null;
  status: string;
  expiresAt: string | null;
  provider: string;
};
