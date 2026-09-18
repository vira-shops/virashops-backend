/**
 * High-level UI outcome for wholesale cheque modals.
 * - AWAITING_PHYSICAL → show mailing address modal after document submit
 * - REJECTED → fail modal with reasons + re-upload / change method
 * - APPROVED → success modal (order registered / processing)
 */
enum ChequeUiOutcome {
  AWAITING_DOCUMENTS = 'AWAITING_DOCUMENTS',
  AWAITING_PHYSICAL = 'AWAITING_PHYSICAL',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
}

export default ChequeUiOutcome;
