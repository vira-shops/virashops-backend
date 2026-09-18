import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import Payment from '../../../domain/model/payment.model';
import type PaymentRepositoryPort from '../../../domain/ports/payment.repository.port';
import PaymentMapper from '../mappers/payment.mapper';
import { payments } from '../schema/payments';

@Injectable()
export default class DrizzlePaymentRepositoryAdapter implements PaymentRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: number): Promise<Payment | null> {
    const row = await this.db.query.payments.findFirst({
      where: and(eq(payments.id, id), isNull(payments.deletedAt)),
    });
    return row ? PaymentMapper.toDomain(row) : null;
  }

  async findByIdForUser(id: number, userId: number): Promise<Payment | null> {
    const row = await this.db.query.payments.findFirst({
      where: and(
        eq(payments.id, id),
        eq(payments.userId, userId),
        isNull(payments.deletedAt),
      ),
    });
    return row ? PaymentMapper.toDomain(row) : null;
  }

  async save(payment: Payment): Promise<Payment> {
    const snap = payment.toSnapshot();
    if (snap.id === null) {
      const [row] = await this.db
        .insert(payments)
        .values({
          userId: snap.userId,
          checkoutSessionId: snap.checkoutSessionId,
          orderId: snap.orderId,
          method: snap.method,
          amount: snap.amount,
          status: snap.status,
          providerRef: snap.providerRef,
          redirectUrl: snap.redirectUrl,
          bankAccountValidationId: snap.bankAccountValidationId,
        })
        .returning();
      return PaymentMapper.toDomain(row);
    }
    const [row] = await this.db
      .update(payments)
      .set({
        orderId: snap.orderId,
        status: snap.status,
        providerRef: snap.providerRef,
        redirectUrl: snap.redirectUrl,
        bankAccountValidationId: snap.bankAccountValidationId,
      })
      .where(eq(payments.id, snap.id))
      .returning();
    return PaymentMapper.toDomain(row);
  }
}
