/**
 * Structured rejection codes for the wholesale fail modal (عدم تایید اعتبار چک).
 * Frontend maps these to Persian copy; admin may send one or more.
 */
enum ChequeRejectionReason {
  /** عدم مطابقت تصویر چک با اطلاعات وارد شده در سامانه صیاد */
  SAYAD_MISMATCH = 'SAYAD_MISMATCH',
  /** چک دارای سابقه عدم پرداخت یا صادرکننده دارای حساب مسدودی است */
  NON_PAYMENT_OR_BLOCKED = 'NON_PAYMENT_OR_BLOCKED',
  /** کیفیت تصویر آپلود شده خوانا نیست */
  IMAGE_QUALITY = 'IMAGE_QUALITY',
}

export default ChequeRejectionReason;

export const CHEQUE_REJECTION_REASON_VALUES = Object.values(
  ChequeRejectionReason,
) as ChequeRejectionReason[];
