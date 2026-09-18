import CheckoutSession from '../model/checkout-session.model';

export default interface CheckoutSessionRepositoryPort {
  findByIdForUser(id: number, userId: number): Promise<CheckoutSession | null>;
  findOpenByUserAndSeller(
    userId: number,
    sellerId: number,
  ): Promise<CheckoutSession | null>;
  save(session: CheckoutSession): Promise<CheckoutSession>;
}
