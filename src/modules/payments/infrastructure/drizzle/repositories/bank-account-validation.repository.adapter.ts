import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import BankAccountValidation from '../../../domain/model/bank-account-validation.model';
import BankAccountValidationStatus from '../../../domain/model/enums/bank-account-validation-status.enum';
import type BankAccountValidationRepositoryPort from '../../../domain/ports/bank-account-validation.repository.port';
import BankAccountValidationMapper from '../mappers/bank-account-validation.mapper';
import { bankAccountValidations } from '../schema/bank-account-validations';

@Injectable()
export default class DrizzleBankAccountValidationRepositoryAdapter implements BankAccountValidationRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async save(
    validation: BankAccountValidation,
  ): Promise<BankAccountValidation> {
    const snap = validation.toSnapshot();
    if (snap.id === null) {
      const [row] = await this.db
        .insert(bankAccountValidations)
        .values({
          userId: snap.userId,
          fullName: snap.fullName,
          accountNumber: snap.accountNumber,
          nationalId: snap.nationalId,
          branchCode: snap.branchCode,
          creditGrade: snap.creditGrade,
          creditCeiling: snap.creditCeiling,
          provider: snap.provider,
          providerRef: snap.providerRef,
          status: snap.status,
          expiresAt: snap.expiresAt,
        })
        .returning();
      return BankAccountValidationMapper.toDomain(row);
    }
    const [row] = await this.db
      .update(bankAccountValidations)
      .set({
        fullName: snap.fullName,
        accountNumber: snap.accountNumber,
        nationalId: snap.nationalId,
        branchCode: snap.branchCode,
        creditGrade: snap.creditGrade,
        creditCeiling: snap.creditCeiling,
        provider: snap.provider,
        providerRef: snap.providerRef,
        status: snap.status,
        expiresAt: snap.expiresAt,
      })
      .where(eq(bankAccountValidations.id, snap.id))
      .returning();
    return BankAccountValidationMapper.toDomain(row);
  }

  async findLatestSucceededForUser(
    userId: number,
    now = new Date(),
  ): Promise<BankAccountValidation | null> {
    const row = await this.db.query.bankAccountValidations.findFirst({
      where: and(
        eq(bankAccountValidations.userId, userId),
        eq(
          bankAccountValidations.status,
          BankAccountValidationStatus.SUCCEEDED,
        ),
        gt(bankAccountValidations.expiresAt, now),
        isNull(bankAccountValidations.deletedAt),
      ),
      orderBy: [desc(bankAccountValidations.createdAt)],
    });
    return row ? BankAccountValidationMapper.toDomain(row) : null;
  }

  async findById(id: number): Promise<BankAccountValidation | null> {
    const row = await this.db.query.bankAccountValidations.findFirst({
      where: and(
        eq(bankAccountValidations.id, id),
        isNull(bankAccountValidations.deletedAt),
      ),
    });
    return row ? BankAccountValidationMapper.toDomain(row) : null;
  }
}
