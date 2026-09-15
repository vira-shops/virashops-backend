# File & Image Upload Guide

Reusable pattern from **mitamed-backend**. Use this when adding uploads to another NestJS (or similar) service.

## Design summary

| Decision | Choice |
|----------|--------|
| Storage | S3-compatible (MinIO locally, AWS S3 in prod) |
| Binary upload | One shared endpoint: `POST /files/upload` |
| Domain APIs | Accept **URLs only** (no multipart on most resources) |
| DB | No `files` table — store URL/key on the owning entity |
| Images | No resize/thumbnails; same path as PDFs |
| Access | Private bucket + short-lived **presigned GET** URLs |

```
Client
  │  1) multipart POST /files/upload  (field: file)
  │     → { data: { url, key, ... } }
  │
  │  2) JSON to domain API with that url
  │     e.g. PATCH /drivers/:id/profile { image: data.url }
  ▼
Postgres column (url / key)     S3 object under uploads/...
```

---

## Dependencies

```bash
npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
npm i -D @types/multer
# NestJS already provides FileInterceptor via @nestjs/platform-express
```

---

## Environment

| Variable | Required | Example |
|----------|----------|---------|
| `S3_ENDPOINT` | yes | `http://minio:9000` or AWS endpoint |
| `S3_ACCESS_KEY` | yes | access key |
| `S3_SECRET_KEY` | yes | secret |
| `S3_BUCKET_NAME` | yes | `mitamed` |
| `S3_REGION` | no | `us-east-1` (default) |

Use `forcePathStyle: true` so MinIO and path-style S3 both work.

---

## Core pieces to copy

### 1. Storage port

```typescript
export interface UploadOptions {
  bucket?: string;
  contentType?: string;
}

export default abstract class FileStoragePort {
  abstract upload(
    buffer: Buffer,
    fileName: string,
    folder: string,
    options?: UploadOptions,
  ): Promise<StoredFile>;

  abstract delete(key: string, bucket?: string): Promise<void>;
  abstract download(key: string, bucket?: string): Promise<Readable>;
  abstract getPresignedUrl(
    key: string,
    bucket?: string,
    expiresIn?: number,
  ): Promise<string>;
}
```

### 2. Stored file model

```typescript
export default class StoredFile {
  constructor(
    public readonly key: string,
    public readonly url: string,
    public readonly bucket?: string,
    public readonly presignedUrl?: string,
  ) {}
}
```

In this repo, `url` and `key` are both set to the **object key** after upload; the client-facing download link is `presignedUrl`.

### 3. S3 adapter (upload + key + presign)

```typescript
async upload(buffer, fileName, folder, options?) {
  const bucketName = options?.bucket ?? this.defaultBucket;
  const key = `${folder}/${Date.now()}-${randomUUID()}${extname(fileName).toLowerCase()}`;

  await this.s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: options?.contentType,
    ContentLength: buffer.length,
  }));

  const presignedUrl = await this.getPresignedUrl(key, bucketName); // default 300s
  return new StoredFile(key, key, bucketName, presignedUrl);
}

async getPresignedUrl(key, bucket?, expiresIn = 300) {
  return getSignedUrl(
    this.s3Client,
    new GetObjectCommand({ Bucket: bucket ?? this.defaultBucket, Key: key }),
    { expiresIn },
  );
}
```

Object key shape: `{folder}/{timestamp}-{uuid}{ext}`  
Generic uploads use folder `uploads`. Domain-specific uploads may use other folders (e.g. `companies/{id}/avatar`, `schedule/exports`).

### 4. Upload endpoint

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;

@Post('upload')
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
async upload(
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        new FileTypeValidator({ fileType: ALLOWED_MIME_TYPES }),
      ],
    }),
  )
  file: Express.Multer.File,
) {
  const stored = await storage.upload(file.buffer, file.originalname, 'uploads', {
    contentType: file.mimetype,
  });

  return {
    data: {
      id: `file_${...}`,
      filename: stored.key.split('/').pop(),
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: stored.presignedUrl ?? stored.url,
      key: stored.key,
    },
  };
}
```

**Multipart field name:** always `file`.

**Response shape clients rely on:**

```json
{
  "data": {
    "id": "file_550e8400-e29b-41d4-a716-446655440000",
    "filename": "1739123456789-550e8400-....jpg",
    "originalName": "example.jpg",
    "mimetype": "image/jpeg",
    "size": 1024,
    "url": "<presigned GET URL>",
    "key": "uploads/1739123456789-uuid.jpg"
  }
}
```

### 5. Validate domain fields that expect uploaded files

Only accept URLs that came from the shared uploader (`/uploads/` in the path):

```typescript
export function isStoredFileUrl(url: string): boolean {
  try {
    return decodeURIComponent(new URL(url).pathname).includes('/uploads/');
  } catch {
    return false;
  }
}

export function extractStorageKeyFromUrl(url: string): string | null {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const i = pathname.indexOf('/uploads/');
    if (i >= 0) return pathname.slice(i + 1); // e.g. uploads/123-uuid.jpg
    return pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}
```

DTO decorator:

```typescript
@IsUrl({ require_tld: false })
@IsStoredFileUrl()
image?: string;
```

### 6. Serving / downloading later

Bucket is **private**. Do not store a permanent public URL.

On read/download:

1. Load stored key (or extract key from URL with `extractStorageKeyFromUrl`)
2. Call `getPresignedUrl(key)` (300s default)
3. Return that URL to the client

Optional helper endpoint in this repo:

```
GET /files/download?key=<objectKey>   → { url: <presigned> }   (auth required)
```

---

## Client workflow (any frontend / other repo)

1. `POST /files/upload` with `FormData` and field `file`
2. Read `response.data.url` (and optionally `data.key`)
3. Send that value in JSON to the domain API (`image`, `receiptUrl`, `medicalFormUrl`, etc.)
4. When displaying later, prefer a fresh presigned URL from a download/view endpoint — do not assume the original `data.url` still works after ~5 minutes

Example (fetch):

```javascript
const form = new FormData();
form.append('file', fileBlob, fileBlob.name);

const res = await fetch(`${API}/files/upload`, { method: 'POST', body: form });
const { data } = await res.json();

await fetch(`${API}/drivers/${id}/profile`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ image: data.url }),
});
```

---

## Two upload styles used here

### A. Shared binary upload (preferred for almost everything)

| Step | Endpoint | Body |
|------|----------|------|
| Upload bytes | `POST /files/upload` | multipart `file` |
| Attach metadata | domain route | JSON with URL |

Used for: driver/assistant images & ID cards, vehicle image, fuel receipts, trip medical forms & signatures, documents, chat `fileData.url`.

### B. Direct multipart on a domain route (exception)

| Endpoint | Auth | Notes |
|----------|------|-------|
| `POST /company/profile/avatar` | company auth | Uploads to `companies/{id}/avatar`, updates entity in one call |

Prefer style **A** in new repos unless you need a single-shot “upload + bind to resource” API.

### C. Server-generated files

PDF exports upload buffers directly via `FileStoragePort.upload(...)` into folders like `schedule/exports` or `fuel/exports` — no client multipart.

---

## Validation rules (as implemented)

| Rule | Value |
|------|--------|
| Max size | 10 MB |
| Allowed MIME | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf` |
| Field name | `file` |
| Storage folder (generic) | `uploads` |
| Domain URL check | pathname contains `/uploads/` |

Company avatar currently has **no** size/MIME pipe — add the same validators if you copy that path.

---

## Auth notes (this repo)

| Endpoint | Auth |
|----------|------|
| `POST /files/upload` | **None** (consider locking this down in other repos) |
| `GET /files/download/:objectName` | Company auth |
| Domain attach/update routes | Their normal guards |

Recommendation for new services: require auth on upload and optionally scope keys by tenant (`uploads/{tenantId}/...`).

---

## What this repo does **not** do

- No image processing (Sharp, thumbnails, format conversion)
- No Cloudinary / local disk / GCS
- No dedicated `files` table
- No CDN in front of the bucket
- No long-lived public object URLs

---

## Checklist for another repo

1. [ ] Add S3 env vars + `forcePathStyle` client
2. [ ] Implement `FileStoragePort` + S3 adapter (`upload`, `delete`, `getPresignedUrl`)
3. [ ] Add `POST /files/upload` with Multer memory storage, size + MIME validation
4. [ ] Return `{ data: { url, key, ... } }` using a **presigned** URL for `url`
5. [ ] Persist **key** (preferred) or a stable path containing `/uploads/` on the entity
6. [ ] Domain DTOs: `@IsStoredFileUrl` (or equivalent) on file URL fields
7. [ ] On read: regenerate presigned URL from key
8. [ ] Keep bucket private
9. [ ] Document the two-step client flow for consumers

---

## Source map (this codebase)

| Concern | Path |
|---------|------|
| Upload controller | `src/modules/files/interfaces/http/controllers/file.controller.ts` |
| Upload use case | `src/modules/files/domain/application/usecases/upload-file.usecase.ts` |
| Response mapper | `src/modules/files/interfaces/http/mappers/file-upload.mapper.ts` |
| S3 adapter | `src/modules/shared/infrastructure/storage/s3-storage.adapter.ts` |
| Port | `src/modules/shared/application/ports/s3-storage.service.port.ts` |
| StoredFile model | `src/modules/shared/domain/models/stored-file.model.ts` |
| URL helpers | `src/modules/shared/utils/stored-file-url.util.ts` |
| DTO validator | `src/modules/shared/validations/is-stored-file-url.validator.ts` |
| Direct avatar upload | `src/modules/company/domain/applications/usecases/update-avatar.usecase.ts` |
