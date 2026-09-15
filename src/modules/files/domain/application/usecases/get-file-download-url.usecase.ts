import { Inject, Injectable } from '@nestjs/common';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';
import { FILE_STORAGE_SERVICE } from '../../../../shared/tokens/port.tokens';
import FileNotFoundError from '../../errors/file-not-found.error';
import InvalidFileError from '../../errors/invalid-file.error';
import type { FileDownloadView } from '../../view-models/file.view-model';
import GetFileDownloadUrlQuery from '../queries/get-file-download-url.query';
import { DEFAULT_PRESIGN_EXPIRES_SECONDS } from '../services/file-upload.constants';

@Injectable()
export default class GetFileDownloadUrlUseCase {
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly storage: FileStorageServicePort,
  ) {}

  async execute(query: GetFileDownloadUrlQuery): Promise<FileDownloadView> {
    const key = query.key?.trim();
    if (!key) {
      throw new InvalidFileError('Object key is required');
    }
    if (key.includes('..') || key.startsWith('/')) {
      throw new InvalidFileError('Invalid object key');
    }

    try {
      const url = await this.storage.getSignedUrl(
        key,
        query.expiresInSeconds ?? DEFAULT_PRESIGN_EXPIRES_SECONDS,
      );
      return { url, key };
    } catch {
      throw new FileNotFoundError();
    }
  }
}
