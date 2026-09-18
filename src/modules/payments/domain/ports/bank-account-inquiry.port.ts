export type BankAccountInquiryInput = {
  fullName: string;
  accountNumber: string;
  nationalId: string;
  branchCode: string;
};

export type BankAccountInquiryResult = {
  creditGrade: string;
  creditCeiling: number;
  providerRef: string;
};

export default interface BankAccountInquiryPort {
  inquire(input: BankAccountInquiryInput): Promise<BankAccountInquiryResult>;
}
