export type SellerSummary = {
  id: number;
  kind: string;
  status: string;
  shopName: string | null;
  profileComplete: boolean;
};

export default interface SellerSummaryQueryPort {
  findByUserId(userId: number): Promise<SellerSummary | null>;
}
