import type { SellerSummary } from './seller-summary.query.port';

export type CreatePendingSellerInput = {
  userId: number;
  kind: 'RETAIL' | 'WHOLESALE' | 'BOTH';
  industryType: string;
  category: string;
  activityType: string;
  documentType: string;
  documentKey: string;
};

export default interface CreatePendingSellerPort {
  create(input: CreatePendingSellerInput): Promise<SellerSummary>;
}
