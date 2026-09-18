import { Inject, Injectable } from '@nestjs/common';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';
import { FILE_STORAGE_SERVICE } from '../../../../shared/tokens/port.tokens';
import { DEFAULT_PRESIGN_EXPIRES_SECONDS } from '../../../../files/domain/application/services/file-upload.constants';
import ChequeSubmission from '../../model/cheque-submission.model';

@Injectable()
export default class ChequeMediaPresenter {
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly storage: FileStorageServicePort,
  ) {}

  async photoUrls(
    submission: ChequeSubmission,
  ): Promise<
    Array<{ imageKey: string; url: string | null; sortOrder: number }>
  > {
    return Promise.all(
      submission.getPhotos().map(async (photo) => ({
        imageKey: photo.imageKey,
        sortOrder: photo.sortOrder,
        url: await this.urlForKey(photo.imageKey),
      })),
    );
  }

  async urlForKey(key: string): Promise<string | null> {
    try {
      return await this.storage.getSignedUrl(
        key,
        DEFAULT_PRESIGN_EXPIRES_SECONDS,
      );
    } catch {
      return null;
    }
  }
}
