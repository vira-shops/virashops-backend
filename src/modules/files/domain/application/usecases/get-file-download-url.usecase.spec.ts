import GetFileDownloadUrlQuery from '../queries/get-file-download-url.query';
import InvalidFileError from '../../errors/invalid-file.error';
import GetFileDownloadUrlUseCase from './get-file-download-url.usecase';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';

describe('GetFileDownloadUrlUseCase', () => {
  const getSignedUrl = jest.fn();
  const storage: FileStorageServicePort = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl,
  };

  const useCase = new GetFileDownloadUrlUseCase(storage);

  beforeEach(() => {
    jest.clearAllMocks();
    getSignedUrl.mockResolvedValue(
      'http://minio:9000/bucket/uploads/a.jpg?sig=1',
    );
  });

  it('returns a presigned url for a valid key', async () => {
    const result = await useCase.execute(
      new GetFileDownloadUrlQuery('uploads/a.jpg'),
    );
    expect(result).toEqual({
      key: 'uploads/a.jpg',
      url: 'http://minio:9000/bucket/uploads/a.jpg?sig=1',
    });
    expect(getSignedUrl).toHaveBeenCalledWith('uploads/a.jpg', 300);
  });

  it('rejects path traversal', async () => {
    await expect(
      useCase.execute(new GetFileDownloadUrlQuery('../secret')),
    ).rejects.toBeInstanceOf(InvalidFileError);
  });
});
