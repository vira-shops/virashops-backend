# Frontend guide — Files & product images

Contract for uploading files and showing product images against this Nest API.

**Base URL (local):** `http://localhost:3000`  
**No `/api` prefix.** Paths are `/files/...`, `/seller/products/...`, `/products/...`.

Shared envelope, CORS/proxy, language, and auth basics: [FRONTEND.md](./FRONTEND.md) · [FRONTEND-AUTH.md](./FRONTEND-AUTH.md).

---

## Mental model (two steps)

Binary upload is **not** on the product form. Always:

```
1) POST /files/upload     → get { key, url }
2) PUT  …/products/:id/images   → send that key in JSON
3) GET  /products/:slug   → show imageUrl / gallery[].url
```

| Concept | What it is | Persist? | Show in UI? |
| ------- | ---------- | -------- | ----------- |
| `key` | Storage path, e.g. `uploads/1739-uuid.jpg` | **Yes** (on the product) | No — use for save/replace |
| `url` / `imageUrl` | Short-lived download link (~5 min) | **No** | **Yes** — `<img src={…}>` |
| Legacy `imageKey` like `pepsi-cola-6pk` | Static asset slug from seed | Already in DB | Map yourself to a CDN/static path; `imageUrl` is `null` |

**Do not** store the upload response `url` as the long-term product image. Store **`key`**. Refresh display URLs from the catalog API (or `GET /files/download?key=`).

---

## Who can do what

| Action | Who | Auth |
| ------ | --- | ---- |
| `POST /files/upload` | Any logged-in user | Bearer JWT |
| `PUT /seller/products/:id/images` | Active **seller** who **owns** the product | Bearer + seller roles |
| `PUT /admin/products/:id/images` | **Admin** (any product) | Bearer + `ADMIN` |
| `GET /products`, `GET /products/:slug` | Public | None |
| `GET /files/download?key=` | Logged-in user | Bearer JWT |

Seller must be `ACTIVE` (booth complete). Wrong owner → `403 FORBIDDEN`.

---

## Screens to build

1. **Seller product gallery editor** — pick files → upload each → preview with returned `url` → save gallery with `PUT /seller/products/:id/images`
2. **Catalog list / PDP** — prefer `imageUrl` / `gallery[].url`; fall back to mapping `imageKey` → static asset when `imageUrl` is `null`
3. **Optional refresh** — if a preview expires, call `GET /files/download?key=` or re-fetch the product

---

## Rules (copy these)

| Rule | Value |
| ---- | ----- |
| Multipart field name | always `file` |
| Max size | **10 MB** |
| Allowed types | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf` |
| Folder / key prefix | `uploads/…` |
| Presign lifetime | ~**300 seconds** (5 minutes) |
| Envelope | every JSON body is `{ status, data }` |

---

## 1. Upload a file

`POST /files/upload`  
`Authorization: Bearer <token>`  
`Content-Type: multipart/form-data`  
Field name: **`file`**

```ts
async function uploadFile(token: string, blob: Blob, filename: string) {
  const form = new FormData();
  form.append('file', blob, filename); // field MUST be "file"

  const res = await fetch(`${API}/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form, // do NOT set Content-Type manually
  });
  const body = await res.json();
  if (body.status !== 200) throw body;
  return body.data as {
    id: string; // e.g. file_<uuid>
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string; // short-lived — preview only
    key: string; // persist this, e.g. uploads/1739-uuid.jpg
  };
}
```

**Success `data` example:**

```json
{
  "id": "file_550e8400-e29b-41d4-a716-446655440000",
  "filename": "1739123456789-550e8400-….jpg",
  "originalName": "photo.jpg",
  "mimetype": "image/jpeg",
  "size": 1024,
  "url": "/uploads/uploads/1739-….jpg",
  "key": "uploads/1739-….jpg"
}
```

(Local storage returns a path-style `url`; MinIO/S3 returns a signed absolute URL. Treat both as opaque preview links.)

| Status | errorCode / cause |
| ------ | ----------------- |
| 401 | `UNAUTHORIZED` — missing/invalid JWT |
| 400 | validation / unsupported type / too large |

---

## 2. Attach images to a product (seller)

`PUT /seller/products/:id/images`  
`Authorization: Bearer <sellerToken>`  
`Content-Type: application/json`

**Replaces the whole gallery** (not append). Send at least one image.

```ts
type ImageInput = {
  key?: string; // preferred — from upload
  url?: string; // optional alternative if it contains /uploads/
  altFa?: string;
  altEn?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

await fetch(`${API}/seller/products/${productId}/images`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    images: [
      { key: uploaded.key, isPrimary: true, altEn: 'Main', sortOrder: 0 },
      { key: second.key, isPrimary: false, sortOrder: 1 },
    ],
  }),
});
```

**Success `data`:**

```ts
{
  id: number;
  images: Array<{
    imageKey: string;
    url: string | null; // fresh short-lived link
    altFa: string | null;
    altEn: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}
```

**Admin (any product):** same body on `PUT /admin/products/:id/images`.

| Status | errorCode |
| ------ | --------- |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` / `SELLER_NOT_ACTIVE` |
| 404 | `PRODUCT_NOT_FOUND` |
| 400 | `INVALID_FILE` (key not under `uploads/`) / `VALIDATION` |

---

## 3. Show images in catalog (public)

### List / search cards

```ts
type ProductCard = {
  id: number;
  slug: string;
  name: string;
  imageKey: string | null;
  imageUrl: string | null; // use this for <img> when present
  seller: {
    id: number;
    shopName: string;
    logoKey: string | null;
    logoUrl: string | null;
  };
  // …price, badges, etc.
};
```

### Detail (`GET /products/:slug`)

Same card fields plus:

```ts
gallery: Array<{
  imageKey: string;
  url: string | null;
  alt: string | null; // language-picked
  isPrimary: boolean;
  sortOrder: number;
}>;
```

### Display helper

```ts
function productImageSrc(
  imageUrl: string | null,
  imageKey: string | null,
  staticAssetBase: string, // your Next public/CDN base for seed slugs
): string | null {
  if (imageUrl) return imageUrl; // uploaded file
  if (imageKey) return `${staticAssetBase}/${imageKey}.webp`; // example mapping
  return null;
}
```

| `imageKey` | `imageUrl` | What to do |
| ---------- | ---------- | ---------- |
| `uploads/…jpg` | signed/path URL | Use `imageUrl` |
| `pepsi-cola-6pk` | `null` | Map `imageKey` → static asset |
| `null` | `null` | Placeholder |

When a signed URL expires (~5 min), re-fetch the product or call:

`GET /files/download?key=<encodeURIComponent(key)>` → `{ url, key }` (JWT required).

---

## End-to-end seller example

```ts
// 1) upload
const uploaded = await uploadFile(token, fileBlob, fileBlob.name);

// 2) attach (replace gallery)
const save = await fetch(`${API}/seller/products/${productId}/images`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    images: [{ key: uploaded.key, isPrimary: true }],
  }),
});
const { data } = await save.json();
// preview: data.images[0].url

// 3) shopper sees it
const detail = await fetch(`${API}/products/${slug}`).then((r) => r.json());
// <img src={detail.data.imageUrl ?? mapAsset(detail.data.imageKey)} />
```

---

## Checklist for frontend

- [ ] Upload uses field name **`file`** and Bearer token  
- [ ] Persist **`key`**, not the upload `url`, when saving a product  
- [ ] Gallery save sends full list (API replaces all images)  
- [ ] Catalog UI prefers `imageUrl` / `gallery[].url`  
- [ ] Legacy seed keys still map via `imageKey` when `imageUrl` is null  
- [ ] Do not assume preview URLs live longer than ~5 minutes  
- [ ] Handle `401` / `403` / `INVALID_FILE` on seller save  

---

## Related

| Doc | Topic |
| --- | ----- |
| [FRONTEND.md](./FRONTEND.md) | Envelope, catalog list/detail shapes |
| [FRONTEND-AUTH.md](./FRONTEND-AUTH.md) | Login / seller JWT |
| [FILE-UPLOAD.md](./FILE-UPLOAD.md) | Backend storage design (deeper) |
| [API-CHECK.md](./API-CHECK.md) | `npm run files-api-check` Docker contract |
