import {
  extractStorageKeyFromUrl,
  isStoredFileKey,
  isStoredFileUrl,
  resolveStoredFileKey,
} from './stored-file-url.util';

describe('stored-file-url.util', () => {
  it('accepts absolute URLs that contain /uploads/', () => {
    expect(
      isStoredFileUrl(
        'http://localhost:9000/bucket/uploads/1739-uuid.jpg?X-Amz-Signature=abc',
      ),
    ).toBe(true);
  });

  it('accepts relative paths that contain /uploads/', () => {
    expect(isStoredFileUrl('/uploads/1739-uuid.jpg')).toBe(true);
  });

  it('rejects unrelated URLs', () => {
    expect(isStoredFileUrl('https://cdn.example.com/images/a.jpg')).toBe(false);
  });

  it('recognizes storage keys under uploads/', () => {
    expect(isStoredFileKey('uploads/1739-uuid.jpg')).toBe(true);
    expect(isStoredFileKey('pepsi-cola-6pk')).toBe(false);
  });

  it('resolves keys from either a key or a URL', () => {
    expect(resolveStoredFileKey('uploads/a.jpg')).toBe('uploads/a.jpg');
    expect(
      resolveStoredFileKey('http://minio:9000/bucket/uploads/a.jpg?sig=1'),
    ).toBe('uploads/a.jpg');
    expect(resolveStoredFileKey('pepsi-cola-6pk')).toBeNull();
  });

  it('extracts the storage key from a presigned URL', () => {
    expect(
      extractStorageKeyFromUrl(
        'http://minio:9000/virashops/uploads/1739-uuid.jpg?X-Amz-Expires=300',
      ),
    ).toBe('uploads/1739-uuid.jpg');
  });

  it('extracts the key from a local path', () => {
    expect(extractStorageKeyFromUrl('/uploads/1739-uuid.jpg')).toBe(
      'uploads/1739-uuid.jpg',
    );
  });
});
