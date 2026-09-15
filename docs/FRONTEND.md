# Virashops frontend ↔ backend API

How the Next.js app talks to this Nest API **today**. tRPC is planned; it is not wired yet. All product HTTP is REST.

**Base URL (local):** `http://localhost:3000`  
**There is no `/api` prefix.** Paths are `/health`, `/auth/...`, `/admin/...`, `/categories/...`, `/products/...`, `/search...`, `/files/...`, `/seller/products/...`.

Auth details: [FRONTEND-AUTH.md](./FRONTEND-AUTH.md).  
Files & product images: [FRONTEND-FILES.md](./FRONTEND-FILES.md).

`API_PREFIX` exists in env but is **not** applied. Do not call `/api/auth/...`.

---

## Connect from Next.js

The API does **not** send CORS headers. Call it from the browser only through a Next.js rewrite/proxy (or enable CORS on the API later).

```js
// next.config.js — example
async rewrites() {
  return [{ source: '/backend/:path*', destination: 'http://localhost:3000/:path*' }];
}
```

Then the browser uses `/backend/auth/signup/step1`, which Next forwards to `http://localhost:3000/auth/signup/step1`.

Server components / Route Handlers can call `http://localhost:3000` directly.

| Env                          | Base URL                             |
| ---------------------------- | ------------------------------------ |
| Local API                    | `http://localhost:3000`              |
| Docker Compose `api` service | `http://api:3000` (server-side only) |

---

## Envelope (every JSON response)

HTTP status **always matches** `body.status`. Unwrap `data`. Never treat the raw body as the payload.

**Success**

```json
{
  "status": 200,
  "data": {}
}
```

**Error**

```json
{
  "status": 401,
  "data": {
    "errorCode": "INVALID_OTP",
    "message": "Invalid verification code"
  }
}
```

Validation `400` may include `details` (class-validator messages):

```json
{
  "status": 400,
  "data": {
    "errorCode": "VALIDATION",
    "message": "firstName must be longer than or equal to 2 characters",
    "details": ["firstName must be longer than or equal to 2 characters"]
  }
}
```

```ts
type ApiSuccess<T> = { status: number; data: T };
type ApiError = {
  status: number;
  data: { errorCode: string; message: string; details?: unknown };
};

function unwrap<T>(body: ApiSuccess<T> | ApiError, httpStatus: number): T {
  if (
    httpStatus >= 400 ||
    (body.data && typeof body.data === 'object' && 'errorCode' in body.data)
  ) {
    throw body.data;
  }
  return (body as ApiSuccess<T>).data;
}
```

Branch on **`errorCode`**, not on the English/Persian `message`. Extra JSON fields are rejected (`forbidNonWhitelisted`).

---

## Auth

**Full frontend contract for login / signup / OTP / seller booth:** [FRONTEND-AUTH.md](./FRONTEND-AUTH.md).

| | |
| - | - |
| Scheme | `Authorization: Bearer <accessToken>` |
| Token | JWT only. **No refresh.** ~1 day |
| Signup | **Step1** (name+phone) → **OTP** (`needsStep2`) → **Step2** (channel/accountType → roles + JWT) |
| Login | phone → OTP → JWT |
| Logout | Denylists `jti`. Cookies not used |

Protected: `GET /auth/me`, `POST /auth/logout`, `PATCH /auth/sellers/me`, `PATCH /admin/sellers/:id/status`.

Do not use deprecated `POST /auth/signup` in new UI.

Phone normalization, role matrix, OTP rules, user shape, and every auth endpoint live in [FRONTEND-AUTH.md](./FRONTEND-AUTH.md).

---

## Language

Error `message` is translated. Default **English**.

| How    | Example               |
| ------ | --------------------- |
| Header | `Accept-Language: fa` |
| Header | `x-lang: fa`          |
| Query  | `?lang=fa`            |

Supported: `en`, `fa`.

---

## Health

### `GET /health` — liveness (no auth)

```json
{ "status": 200, "data": { "status": "ok" } }
```

---

## Categories (public, no auth)

Product taxonomy for the mega-menu, homepage shortcuts, and browse. **Not** the seller signup `category` field (that is industry/guild).

Names follow `Accept-Language`, `x-lang`, or `?lang=` (`fa` | `en`). `productCount` is the number of **published Active** products in that category. Optional `channel=RETAIL|WHOLESALE` is ignored for now (same tree).

Tree is 3 levels: L1 (e.g. Food) → L2 (Staples, Protein, …) → L3 (Bread, Chicken, …).

### `GET /categories/tree` — mega-menu

**Success `data`:** array of nodes `{ id, slug, name, nameFa, nameEn, parentId, depth, iconKey, imageKey, sortOrder, productCount, children: Node[] }`.

### `GET /categories/home` — homepage

**Success `data`:**

```json
{
  "shortcuts": [{ "slug": "staples", "iconKey": "staples", "productCount": 0 }],
  "featured": {
    "parent": { "slug": "food", "name": "مواد غذایی", "productCount": 0 },
    "children": [{ "slug": "staples", "imageKey": "staples" }]
  }
}
```

`shortcuts` = L2 nodes with an `iconKey` (circular icons). `featured.children` = cards under the first root.

### `GET /categories/:slug` — browse one node

**Success `data`:** `{ category, ancestors, children }` (same summary shape).
Unknown slug → `404 CATEGORY_NOT_FOUND`.

---

## Products (public, no auth)

One catalog for retail and wholesale. `channel` only changes which price block is returned — not a second product list.

**Card fields** (list, search hits, related):

```ts
type ProductCard = {
  id: number;
  slug: string;
  name: string;
  imageKey: string | null; // asset slug OR storage key `uploads/...`
  imageUrl: string | null; // short-lived URL when imageKey is under uploads/; else null (map imageKey → static asset)
  price: number; // tomans; retail or wholesale unit price by channel
  compareAtPrice: number | null;
  discountPercent: number;
  badges: string[]; // e.g. ["20%"]
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  seller: {
    id: number;
    shopName: string;
    logoKey: string | null;
    logoUrl: string | null; // same rule as imageUrl
  };
  storeCount: number; // always 1 in this slice
  channel: 'RETAIL' | 'WHOLESALE';
};
```

Out-of-stock products stay visible. Unpublished / draft products are not returned (`404 PRODUCT_NOT_FOUND` on detail).

### Seller product images (auth)

Full frontend walkthrough (upload → attach → display, with copy-paste examples): **[FRONTEND-FILES.md](./FRONTEND-FILES.md)**.

1. `POST /files/upload` with multipart field `file` (JPEG/PNG/WebP/GIF/PDF, max 10 MB) → `{ key, url, ... }`
2. `PUT /seller/products/:id/images` with `{ images: [{ key, altFa?, altEn?, isPrimary?, sortOrder? }] }` (seller must own the product; must be ACTIVE)
3. Public catalog reads return `imageUrl` / gallery `url` for keys under `uploads/`

Admin override: `PUT /admin/products/:id/images` (same body).

### `GET /products`

| Query           | Default     | Notes                                      |
| --------------- | ----------- | ------------------------------------------ |
| `channel`       | `RETAIL`    | `RETAIL` \| `WHOLESALE`                    |
| `page`          | `1`         |                                            |
| `limit`         | `20`        | max `50`                                   |
| `sort`          | `relevant`  | `newest` \| `cheapest` \| `relevant`       |
| `categoryId`    | —           |                                            |
| `categorySlug`  | —           | unknown slug → empty page                  |
| `q`             | —           | name / brand / slug                        |
| `minPrice`      | —           | retail price filter                        |
| `maxPrice`      | —           | retail price filter                        |

**Success `data`:** `{ items: ProductCard[], total, page, limit }`

### `GET /products/:slug`

Query: `channel=RETAIL|WHOLESALE` (default `RETAIL`).

**Success `data`:** card fields plus:

```ts
{
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  sku: string | null;
  gallery: Array<{
    imageKey: string;
    url: string | null; // short-lived when imageKey is uploads/...
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  specs: Array<{ key: string; label: string; value: string }>;
  productionDate: string | null;
  expiryDate: string | null;
  category: { id: number; slug: string; name: string };
  wholesale: null | {
    moq: number;
    maxQty: number | null;
    packMultiple: number;
    cashPrice: number | null;
    packPrice: number | null;
    installment: { months: number; monthlyFeePercent: number } | null;
    tiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>;
  };
  related: ProductCard[]; // same category first; fill from parent category if < 3
}
```

`wholesale` is **only** populated when `channel=WHOLESALE`. Retail always gets `wholesale: null`.

Related products are recommendations from **our published catalog** (same category / parent fallback). No Digikala/Torob scraping.

| Status | errorCode            | When                         |
| ------ | -------------------- | ---------------------------- |
| 404    | `PRODUCT_NOT_FOUND`  | Unknown, draft, or inactive  |

---

## Search (public, no auth)

Guest search is allowed. **Recent searches stay on the client** (no server history).

### `GET /search/suggestions?q=`

Empty `q` → `{ categorized: [], terms: [] }` (show recents locally).

**Success `data`:**

```json
{
  "categorized": [
    {
      "text": "مرغ",
      "category": { "id": 15, "slug": "chicken", "name": "مرغ" }
    }
  ],
  "terms": ["مرغ", "سینه مرغ تازه"]
}
```

`categorized` comes from matching categories. `terms` merges category names and matching **published product** names from our catalog.

### `GET /search?q=&page=&limit=`

Also accepts `sort`, `categoryId`, `minPrice`, `maxPrice`, `channel` and applies them to product hits:

| Query         | Applied to products                         |
| ------------- | ------------------------------------------- |
| `q`           | name / brand / slug                         |
| `channel`     | `RETAIL` \| `WHOLESALE` (default `RETAIL`)  |
| `sort`        | `newest` \| `cheapest` \| `relevant`/`relevance` |
| `categoryId`  | exact category filter                       |
| `minPrice` / `maxPrice` | retail price range                  |
| `page` / `limit` | pagination (max 50)                      |

```json
{
  "query": "chicken",
  "products": {
    "items": [
      {
        "id": 5,
        "slug": "chicken-breast-1kg",
        "name": "Fresh Chicken Breast",
        "imageKey": "chicken-breast-1kg",
        "price": 420000,
        "compareAtPrice": 450000,
        "discountPercent": 10,
        "badges": ["10%"],
        "stockStatus": "IN_STOCK",
        "seller": { "id": 1, "shopName": "ویراشاپس", "logoKey": "virashops" },
        "storeCount": 1,
        "channel": "RETAIL"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  },
  "categories": [{ "slug": "chicken", "name": "Chicken", "productCount": 1 }]
}
```

Product hits use the same `ProductCard` shape as `GET /products`. Empty `q` still returns categories `[]` and an empty product page (HTTP **200**).

---

## Error codes (quick table)

| errorCode                   | HTTP | Use in UI                                          |
| --------------------------- | ---- | -------------------------------------------------- |
| `VALIDATION`                | 400  | Show `details` / field errors                      |
| `INVALID_PHONE`             | 400  | Invalid mobile                                     |
| `SELLER_PROFILE_INCOMPLETE` | 400  | Admin: booth not filled                            |
| `UNAUTHORIZED`              | 401  | Missing/bad/logged-out token — send to login       |
| `INVALID_OTP`               | 401  | Wrong code                                         |
| `OTP_EXPIRED`               | 401  | Ask for a new code                                 |
| `FORBIDDEN`                 | 403  | Wrong role                                         |
| `ACCOUNT_INACTIVE`          | 403  | Account disabled                                   |
| `NOT_FOUND`                 | 404  | Generic missing resource                           |
| `ACCOUNT_NOT_FOUND`         | 404  | Login: unknown phone / expired signup draft        |
| `SELLER_NOT_FOUND`          | 404  | No seller booth (e.g. buyer hitting seller routes) |
| `CATEGORY_NOT_FOUND`        | 404  | Unknown category slug                              |
| `PRODUCT_NOT_FOUND`         | 404  | Unknown / unpublished product slug                 |
| `PHONE_ALREADY_REGISTERED`  | 409  | Offer login instead                                |
| `SELLER_ALREADY_EXISTS`     | 409  | Already a seller                                   |
| `OTP_RATE_LIMITED`          | 429  | Wait ~60s (or later if 5 SMS / 10 min)             |
| `INTERNAL`                  | 500  | Unexpected                                         |

---

## Client checklist

1. Base URL **without** `/api`.
2. Always read `body.data`; compare `errorCode`.
3. Auth: follow [FRONTEND-AUTH.md](./FRONTEND-AUTH.md) (step1 → OTP → step2; login = phone + OTP).
4. Prefer a Next.js rewrite until CORS exists.
5. Catalog/search: public; no auth required for browse.

---

## Not available yet

Seller product CRUD, inventory mutations, cart, orders, payments, notifications, tRPC, multi-seller comparison rows, external marketplace price feeds.

`GET /` is a leftover Nest hello-world, not a product API.

Swagger is configured in env (`SWAGGER_PATH=docs`) but **not mounted** in bootstrap yet — this file is the contract.
