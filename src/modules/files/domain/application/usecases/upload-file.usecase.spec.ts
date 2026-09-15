import UploadFileCommand from '../commands/upload-file.command';
import InvalidFileError from '../../errors/invalid-file.error';
import UploadFileUseCase from './upload-file.usecase';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';

describe('UploadFileUseCase', () => {
  const upload = jest.fn();
  const getSignedUrl = jest.fn();
  const storage: FileStorageServicePort = {
    upload,
    delete: jest.fn(),
    getSignedUrl,
  };

  const useCase = new UploadFileUseCase(storage);

  beforeEach(() => {
    jest.clearAllMocks();
    upload.mockImplementation((key: string) => Promise.resolve(key));
    getSignedUrl.mockResolvedValue(
      'http://minio:9000/bucket/uploads/file.jpg?sig=1',
    );
  });

  it('uploads under uploads/ and returns a presigned url', async () => {
    const result = await useCase.execute(
      new UploadFileCommand(Buffer.from('hello'), 'photo.JPG', 'image/jpeg', 5),
    );

    expect(result.id).toMatch(/^file_/);
    expect(result.key).toMatch(/^uploads\/\d+-.+\.jpg$/);
    expect(result.filename).toMatch(/\.jpg$/);
    expect(result.originalName).toBe('photo.JPG');
    expect(result.mimetype).toBe('image/jpeg');
    expect(result.size).toBe(5);
    expect(result.url).toContain('sig=1');
    expect(upload).toHaveBeenCalledWith(
      result.key,
      expect.any(Buffer),
      'image/jpeg',
    );
    expect(getSignedUrl).toHaveBeenCalledWith(result.key, 300);
  });

  it('rejects unsupported mime types', async () => {
    await expect(
      useCase.execute(
        new UploadFileCommand(Buffer.from('x'), 'a.txt', 'text/plain', 1),
      ),
    ).rejects.toBeInstanceOf(InvalidFileError);
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects empty files', async () => {
    await expect(
      useCase.execute(
        new UploadFileCommand(Buffer.alloc(0), 'a.jpg', 'image/jpeg', 0),
      ),
    ).rejects.toBeInstanceOf(InvalidFileError);
  });
});
