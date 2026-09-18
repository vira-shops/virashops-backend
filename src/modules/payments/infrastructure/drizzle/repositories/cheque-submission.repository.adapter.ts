import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import ChequeSubmission from '../../../domain/model/cheque-submission.model';
import ChequeVerificationStatus from '../../../domain/model/enums/cheque-verification-status.enum';
import type ChequeSubmissionRepositoryPort from '../../../domain/ports/cheque-submission.repository.port';
import type { ChequeReviewListItem } from '../../../domain/ports/cheque-submission.repository.port';
import ChequeSubmissionMapper from '../mappers/cheque-submission.mapper';
import {
  chequeSubmissionPhotos,
  chequeSubmissions,
} from '../schema/cheque-submissions';
import { payments } from '../schema/payments';

@Injectable()
export default class DrizzleChequeSubmissionRepositoryAdapter implements ChequeSubmissionRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByPaymentId(paymentId: number): Promise<ChequeSubmission | null> {
    const row = await this.db.query.chequeSubmissions.findFirst({
      where: and(
        eq(chequeSubmissions.paymentId, paymentId),
        isNull(chequeSubmissions.deletedAt),
      ),
    });
    if (!row) {
      return null;
    }
    const photos = await this.loadPhotos(row.id);
    return ChequeSubmissionMapper.toDomain(row, photos);
  }

  async findById(id: number): Promise<ChequeSubmission | null> {
    const row = await this.db.query.chequeSubmissions.findFirst({
      where: and(
        eq(chequeSubmissions.id, id),
        isNull(chequeSubmissions.deletedAt),
      ),
    });
    if (!row) {
      return null;
    }
    const photos = await this.loadPhotos(row.id);
    return ChequeSubmissionMapper.toDomain(row, photos);
  }

  async listByStatus(
    status: ChequeVerificationStatus | null,
  ): Promise<ChequeReviewListItem[]> {
    const conditions = [
      isNull(chequeSubmissions.deletedAt),
      isNull(payments.deletedAt),
    ];
    if (status) {
      conditions.push(eq(chequeSubmissions.status, status));
    }

    const rows = await this.db
      .select({
        submission: chequeSubmissions,
        paymentId: payments.id,
        paymentAmount: payments.amount,
        paymentStatus: payments.status,
        userId: payments.userId,
      })
      .from(chequeSubmissions)
      .innerJoin(payments, eq(payments.id, chequeSubmissions.paymentId))
      .where(and(...conditions))
      .orderBy(asc(chequeSubmissions.createdAt));

    const items: ChequeReviewListItem[] = [];
    for (const row of rows) {
      const photos = await this.loadPhotos(row.submission.id);
      items.push({
        submission: ChequeSubmissionMapper.toDomain(row.submission, photos),
        paymentId: row.paymentId,
        paymentAmount: row.paymentAmount,
        paymentStatus: row.paymentStatus,
        userId: row.userId,
      });
    }
    return items;
  }

  async save(submission: ChequeSubmission): Promise<ChequeSubmission> {
    const snap = submission.toSnapshot();
    if (snap.id === null) {
      const [row] = await this.db
        .insert(chequeSubmissions)
        .values({
          paymentId: snap.paymentId,
          fullName: snap.fullName,
          accountNumber: snap.accountNumber,
          nationalId: snap.nationalId,
          branchCode: snap.branchCode,
          status: snap.status,
          rejectionReason: snap.rejectionReason,
          rejectionReasons: snap.rejectionReasons,
          reviewedByUserId: snap.reviewedByUserId,
          reviewedAt: snap.reviewedAt,
          cadence: snap.cadence,
          downPayment: snap.downPayment,
          planItems: snap.planItems,
        })
        .returning();
      await this.replacePhotos(row.id, snap.photos);
      const photos = await this.loadPhotos(row.id);
      return ChequeSubmissionMapper.toDomain(row, photos);
    }

    const [row] = await this.db
      .update(chequeSubmissions)
      .set({
        fullName: snap.fullName,
        accountNumber: snap.accountNumber,
        nationalId: snap.nationalId,
        branchCode: snap.branchCode,
        status: snap.status,
        rejectionReason: snap.rejectionReason,
        rejectionReasons: snap.rejectionReasons,
        reviewedByUserId: snap.reviewedByUserId,
        reviewedAt: snap.reviewedAt,
        cadence: snap.cadence,
        downPayment: snap.downPayment,
        planItems: snap.planItems,
      })
      .where(eq(chequeSubmissions.id, snap.id))
      .returning();
    await this.replacePhotos(row.id, snap.photos);
    const photos = await this.loadPhotos(row.id);
    return ChequeSubmissionMapper.toDomain(row, photos);
  }

  private async loadPhotos(submissionId: number) {
    return this.db
      .select()
      .from(chequeSubmissionPhotos)
      .where(
        and(
          eq(chequeSubmissionPhotos.submissionId, submissionId),
          isNull(chequeSubmissionPhotos.deletedAt),
        ),
      )
      .orderBy(asc(chequeSubmissionPhotos.sortOrder));
  }

  private async replacePhotos(
    submissionId: number,
    photos: Array<{ imageKey: string; sortOrder: number }>,
  ): Promise<void> {
    await this.db
      .delete(chequeSubmissionPhotos)
      .where(eq(chequeSubmissionPhotos.submissionId, submissionId));
    if (photos.length === 0) {
      return;
    }
    await this.db.insert(chequeSubmissionPhotos).values(
      photos.map((photo) => ({
        submissionId,
        imageKey: photo.imageKey,
        sortOrder: photo.sortOrder,
      })),
    );
  }
}
