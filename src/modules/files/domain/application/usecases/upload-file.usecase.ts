import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';
import StoredFile from '../../../../shared/domain/models/stored-file.model';
import { FILE_STORAGE_SERVICE } from '../../../../shared/tokens/port.tokens';
import InvalidFileError from '../../errors/invalid-file.error';
import type { FileUploadView } from '../../view-models/file.view-model';
import UploadFileCommand from '../commands/upload-file.command';
import {
  ALLOWED_MIME_SET,
  DEFAULT_PRESIGN_EXPIRES_SECONDS,
  MAX_FILE_SIZE,
} from '../services/file-upload.constants';

@Injectable()
export default class UploadFileUseCase {
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly storage: FileStorageServicePort,
  ) {}

  async execute(command: UploadFileCommand): Promise<FileUploadView> {
    this.assertValid(command);

    const extension = this.normalizeExtension(
      command.originalName,
      command.mimeType,
    );
    const fileId = randomUUID();
    const key = `${command.folder}/${Date.now()}-${fileId}${extension}`;

    await this.storage.upload(key, command.buffer, command.mimeType);
    const presignedUrl = await this.storage.getSignedUrl(
      key,
      DEFAULT_PRESIGN_EXPIRES_SECONDS,
    );

    const stored = new StoredFile(key, key, undefined, presignedUrl);
    const filename = stored.key.split('/').pop() ?? stored.key;

    return {
      id: `file_${fileId}`,
      filename,
      originalName: command.originalName,
      mimetype: command.mimeType,
      size: command.size,
      url: stored.presignedUrl ?? stored.url,
      key: stored.key,
    };
  }

  private assertValid(command: UploadFileCommand): void {
    if (!command.buffer?.length) {
      throw new InvalidFileError('File is required');
    }
    if (command.size > MAX_FILE_SIZE) {
      throw new InvalidFileError('File exceeds the 10 MB limit');
    }
    if (!ALLOWED_MIME_SET.has(command.mimeType)) {
      throw new InvalidFileError(
        'Only JPEG, PNG, WebP, GIF, and PDF files are allowed',
      );
    }
  }

  private normalizeExtension(originalName: string, mimeType: string): string {
    const fromName = extname(originalName).toLowerCase();
    if (fromName && fromName.length <= 8) {
      return fromName;
    }
    const byMime: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
    };
    return byMime[mimeType] ?? '';
  }
}
