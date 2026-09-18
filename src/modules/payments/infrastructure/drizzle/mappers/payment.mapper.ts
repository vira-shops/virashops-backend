import Payment from '../../../domain/model/payment.model';
import PaymentMethodName from '../../../domain/model/enums/payment-method.enum';
import PaymentStatus from '../../../domain/model/enums/payment-status.enum';
import type { PaymentRow } from '../schema/payments';

export default class PaymentMapper {
  static toDomain(row: PaymentRow): Payment {
    return Payment.restore({
      id: row.id,
      userId: row.userId,
      checkoutSessionId: row.checkoutSessionId,
      orderId: row.orderId,
      method: row.method as PaymentMethodName,
      amount: row.amount,
      status: row.status as PaymentStatus,
      providerRef: row.providerRef,
      redirectUrl: row.redirectUrl,
      bankAccountValidationId: row.bankAccountValidationId ?? null,
    });
  }
}
