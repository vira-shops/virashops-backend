import Payment from '../model/payment.model';

export default interface PaymentRepositoryPort {
  findById(id: number): Promise<Payment | null>;
  findByIdForUser(id: number, userId: number): Promise<Payment | null>;
  save(payment: Payment): Promise<Payment>;
}
