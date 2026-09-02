export type SellerSummary = {
  id: number;
  kind: string;
  status: string;
  shopName: string;
};

export default interface SellerSummaryQueryPort {
  findByUserId(userId: number): Promise<SellerSummary | null>;
}
