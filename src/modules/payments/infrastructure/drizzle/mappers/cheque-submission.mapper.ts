import ChequeSubmission from '../../../domain/model/cheque-submission.model';
import ChequeCadence from '../../../domain/model/enums/cheque-cadence.enum';
import ChequeVerificationStatus from '../../../domain/model/enums/cheque-verification-status.enum';
import type {
  ChequeSubmissionPhotoRow,
  ChequeSubmissionRow,
} from '../schema/cheque-submissions';

export default class ChequeSubmissionMapper {
  static toDomain(
    row: ChequeSubmissionRow,
    photos: ChequeSubmissionPhotoRow[],
  ): ChequeSubmission {
    return ChequeSubmission.restore({
      id: row.id,
      paymentId: row.paymentId,
      fullName: row.fullName,
      accountNumber: row.accountNumber,
      nationalId: row.nationalId,
      branchCode: row.branchCode,
      status: row.status as ChequeVerificationStatus,
      rejectionReason: row.rejectionReason,
      rejectionReasons: row.rejectionReasons ?? [],
      reviewedByUserId: row.reviewedByUserId,
      reviewedAt: row.reviewedAt,
      cadence: (row.cadence as ChequeCadence | null) ?? null,
      downPayment: row.downPayment,
      planItems: row.planItems ?? [],
      photos: photos
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((photo) => ({
          imageKey: photo.imageKey,
          sortOrder: photo.sortOrder,
        })),
    });
  }
}
