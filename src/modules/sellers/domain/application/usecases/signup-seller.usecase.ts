import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';
import { FILE_STORAGE_SERVICE } from '../../../../shared/tokens/port.tokens';
import SellerAlreadyExistsError from '../../../../users/domain/errors/seller-already-exists.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import EnsureUserForSellerCommand from '../../../../users/domain/application/commands/ensure-user-for-seller.command';
import EnsureUserForSellerUseCase from '../../../../users/domain/application/usecases/ensure-user-for-seller.usecase';
import IssueSessionUseCase from '../../../../users/domain/application/usecases/issue-session.usecase';
import AuthSession from '../../../../users/domain/view-models/auth-session.view-model';
import InvalidSellerFieldError from '../../errors/invalid-seller-field.error';
import SellerDocumentRequiredError from '../../errors/seller-document-required.error';
import SalesType from '../../model/enums/sales-type.enum';
import SellerKind from '../../model/enums/seller-kind.enum';
import Seller from '../../model/seller.model';
import type SellerRepositoryPort from '../../ports/seller.repository.port';
import { SELLER_REPOSITORY } from '../../../shared/tokens/port.token';
import SignupSellerCommand from '../commands/signup-seller.command';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Injectable()
export default class SignupSellerUseCase {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellers: SellerRepositoryPort,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly files: FileStorageServicePort,
    private readonly ensureUser: EnsureUserForSellerUseCase,
    private readonly issueSession: IssueSessionUseCase,
  ) {}

  async execute(command: SignupSellerCommand): Promise<AuthSession> {
    this.assertFields(command);
    if (!command.document?.buffer?.length) {
      throw new SellerDocumentRequiredError();
    }
    if (!ALLOWED_MIME.has(command.document.mimeType)) {
      throw new InvalidSellerFieldError('Unsupported document type');
    }

    const sellerRole =
      command.kind === SellerKind.WHOLESALE
        ? Role.WHOLESALE_SELLER
        : Role.RETAIL_SELLER;

    const user = await this.ensureUser.execute(
      new EnsureUserForSellerCommand(
        command.phone,
        command.fullName,
        sellerRole,
      ),
    );

    const existing = await this.sellers.findByUserId(user.getId());
    if (existing) {
      throw new SellerAlreadyExistsError();
    }

    const extension = this.extension(command.document.originalName, command.document.mimeType);
    const key = `sellers/${user.getId()}/${randomUUID()}${extension}`;
    const documentKey = await this.files.upload(
      key,
      command.document.buffer,
      command.document.mimeType,
    );

    const saved = await this.sellers.save(
      Seller.create({
        userId: user.getId(),
        kind: command.kind,
        shopName: command.shopName,
        workplacePhone: command.workplacePhone,
        province: command.province,
        city: command.city,
        postalCode: command.postalCode,
        salesType: command.salesType,
        address: command.address,
        documentType: command.documentType,
        documentKey,
      }),
    );

    return this.issueSession.execute(user, {
      id: saved.getId(),
      kind: saved.getKind(),
      status: saved.getStatus(),
      shopName: saved.getShopName(),
    });
  }

  private assertFields(command: SignupSellerCommand): void {
    if (!command.shopName.trim()) {
      throw new InvalidSellerFieldError('Shop name is required');
    }
    if (!command.province.trim() || !command.city.trim()) {
      throw new InvalidSellerFieldError('Province and city are required');
    }
    if (!command.address.trim()) {
      throw new InvalidSellerFieldError('Workplace address is required');
    }
    if (!Object.values(SalesType).includes(command.salesType)) {
      throw new InvalidSellerFieldError('Sales type is required');
    }
    if (command.postalCode && !/^\d{10}$/.test(command.postalCode)) {
      throw new InvalidSellerFieldError('Postal code must be 10 digits');
    }
  }

  private extension(name: string, mime: string): string {
    const fromName = name.includes('.')
      ? name.slice(name.lastIndexOf('.')).toLowerCase()
      : '';
    if (fromName) {
      return fromName;
    }
    if (mime === 'application/pdf') {
      return '.pdf';
    }
    return '.jpg';
  }
}
