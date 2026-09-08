# Virashops frontend ↔ backend API

How the Next.js app talks to this Nest API **today**. tRPC is planned; it is not wired yet. All product HTTP is REST.

**Base URL (local):** `http://localhost:3000`  
**There is no `/api` prefix.** Paths are `/health`, `/auth/...`, `/admin/...`, `/categories/...`, `/products/...`, `/search...`.

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

Then the browser uses `/backend/auth/signup`, which Next forwards to `http://localhost:3000/auth/signup`.

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

|                                                |                                                                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Scheme                                         | `Authorization: Bearer <accessToken>`                                                                                      |
| Token                                          | JWT only. **No refresh token.** Default lifetime **1 day** (`JWT_EXPIRES_IN`).                                             |
| Payload (do not trust on the client for authz) | `{ sub, phone, roles[], jti }`                                                                                             |
| Logout                                         | Denylists this token (`jti`). Store the token; send it on logout. After logout, the same token returns `401 UNAUTHORIZED`. |
| Cookies                                        | Not used.                                                                                                                  |

Protected routes: `GET /auth/me`, `POST /auth/logout`, `PATCH /auth/sellers/me`, `PATCH /admin/sellers/:id/status`.

Missing/invalid/expired/denylisted token → `401` `{ errorCode: "UNAUTHORIZED" }`.

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

## Phone

Send Iranian mobile. Backend normalizes and **stores** `09xxxxxxxxx`.

Accepted input:

| Input                                               | Stored        |
| --------------------------------------------------- | ------------- |
| `09123456789`                                       | `09123456789` |
| `9123456789`                                        | `09123456789` |
| `+989123456789` / `989123456789` / `00989123456789` | `09123456789` |

Invalid → `400` `INVALID_PHONE`.

---

## Roles, channel, account type

There is **no public admin register**. Admin is seed-only (`ADMIN_PHONE`).

**Channel** = which app the user is in (`RETAIL` or `WHOLESALE`).  
**Account type** = what they sign up as (`BUYER` | `SELLER` | `BOTH`).

Backend assigns roles. Do not send `roles`.

| `channel`   | `accountType` | `roles` after OTP                                      | Seller booth `kind` |
| ----------- | ------------- | ------------------------------------------------------ | ------------------- |
| `RETAIL`    | `BUYER`       | `RETAIL_BUYER`                                         | — (`seller: null`)  |
| `WHOLESALE` | `BUYER`       | `WHOLESALE_BUYER`                                      | —                   |
| `RETAIL`    | `SELLER`      | `RETAIL_BUYER`, `RETAIL_SELLER`                        | `RETAIL`            |
| `WHOLESALE` | `SELLER`      | `WHOLESALE_BUYER`, `WHOLESALE_SELLER`                  | `WHOLESALE`         |
| `RETAIL`    | `BOTH`        | `RETAIL_BUYER`, `RETAIL_SELLER`, `WHOLESALE_SELLER`    | `BOTH`              |
| `WHOLESALE` | `BOTH`        | `WHOLESALE_BUYER`, `RETAIL_SELLER`, `WHOLESALE_SELLER` | `BOTH`              |

Also: `ADMIN` (seed only).

**Seller booth is not “approved” by OTP.** OTP only verifies the phone. Booth starts `PENDING` with an incomplete shop profile. An admin sets `ACTIVE` only after the seller completes the booth.

User `accountStatus`: `ACTIVE` | `INACTIVE` | `SUSPENDED`. Inactive → `403 ACCOUNT_INACTIVE`.

Seller `status`: `PENDING` | `ACTIVE` | `SUSPENDED` | `INACTIVE`.

---

## OTP (login and signup)

| Rule               | Value                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Length             | **Exactly 6 digits** (string). `12345` → `400 VALIDATION`.                                                       |
| TTL                | **120 seconds**                                                                                                  |
| Resend cooldown    | **60 seconds** (`OTP_RATE_LIMITED` / **429**)                                                                    |
| Max sends          | **5 per 10 minutes** (same 429)                                                                                  |
| Max wrong verifies | **5** then `401 OTP_EXPIRED`                                                                                     |
| Signup draft TTL   | Same **120s**. If they don’t verify in time, they must **sign up again**.                                        |
| Production         | SMS. Never show the code in the API.                                                                             |
| Local/dev          | If the API has `OTP_DEV_CODE`, that fixed code is used (often `123456`). The client must still collect 6 digits. |

**Signup never returns a JWT.** Only `POST /auth/otp/verify` returns `accessToken`.

---

## User object (`data.user` and `GET /auth/me`)

```ts
type SellerSummary = {
  id: number;
  kind: 'RETAIL' | 'WHOLESALE' | 'BOTH';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  shopName: string | null;
  profileComplete: boolean;
};

type AuthUser = {
  id: number;
  phone: string; // 09xxxxxxxxx
  firstName: string;
  lastName: string;
  fullName: string; // first + last
  roles: string[];
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  phoneVerified: boolean;
  activityType: string | null;
  guildType: string | null;
  seller: SellerSummary | null; // buyers: null
};
```

---

## Flows

### Buyer signup → JWT

1. `POST /auth/signup` (JSON) → `{ otpSent: true }`
2. User enters 6-digit code (resend: `POST /auth/otp/request`)
3. `POST /auth/otp/verify` → `{ accessToken, user }`
4. Persist `accessToken`. Call `GET /auth/me` on app load.

### Seller / both signup → booth

1. `POST /auth/signup` as **`multipart/form-data`** with file field **`document`**
2. `POST /auth/otp/verify` → JWT. `user.seller.status === "PENDING"`, `profileComplete === false`
3. `PATCH /auth/sellers/me` with shop fields → `profileComplete: true` (still `PENDING`)
4. Admin later `PATCH /admin/sellers/:id/status` `{ "status": "ACTIVE" }`
5. Gate seller-only UI on `user.seller?.status === "ACTIVE"` and `profileComplete`

### Login (existing account)

1. `POST /auth/otp/request` `{ "phone" }`
2. `POST /auth/otp/verify` `{ "phone", "code" }` → JWT

Unknown phone with no pending signup → `404 ACCOUNT_NOT_FOUND`.

---

## Endpoints

All success statuses below are **200**. JSON `Content-Type: application/json` unless noted.

### `GET /health` — liveness (no auth)

```json
{ "status": 200, "data": { "status": "ok" } }
```

---

### `POST /auth/signup` — start signup, send OTP (no JWT)

Buyer may send JSON. Seller / both **must** send `multipart/form-data` (file field name `document`). JSON is also accepted for buyers via `application/json`.

**Shared fields**

| Field          | Required | Rules                                       |
| -------------- | -------- | ------------------------------------------- |
| `firstName`    | yes      | string, 2–80                                |
| `lastName`     | yes      | string, 2–80                                |
| `phone`        | yes      | Iranian mobile (see Phone)                  |
| `channel`      | yes      | `RETAIL` \| `WHOLESALE`                     |
| `accountType`  | yes      | `BUYER` \| `SELLER` \| `BOTH`               |
| `activityType` | yes      | string (guild/activity label from the form) |

**Buyer extra:** `guildType` required.

**Seller / both extra:** `industryType`, `category` required. `document` file required. `documentType` optional: `NATIONAL_ID` \| `BUSINESS_LICENSE` (default `BUSINESS_LICENSE`).

**Document file**

- Field name: `document`
- MIME: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

**JSON example (buyer)**

```http
POST /auth/signup
Content-Type: application/json

{
  "firstName": "Sara",
  "lastName": "Karimi",
  "phone": "09123456789",
  "channel": "RETAIL",
  "accountType": "BUYER",
  "activityType": "GROCERY",
  "guildType": "FOOD"
}
```

**Multipart example (seller)**

```http
POST /auth/signup
Content-Type: multipart/form-data

firstName: Ali
lastName: Rezaei
phone: 09123456780
channel: RETAIL
accountType: SELLER
activityType: STORE
industryType: FOOD
category: SNACKS
documentType: NATIONAL_ID
document: <file>
```

**Success**

```json
{ "status": 200, "data": { "otpSent": true } }
```

No `accessToken`.

| Status | errorCode                  | When                                                                         |
| ------ | -------------------------- | ---------------------------------------------------------------------------- |
| 400    | `VALIDATION`               | Missing/invalid fields, extra fields, bad file MIME, missing seller document |
| 400    | `INVALID_PHONE`            | Phone not Iranian mobile                                                     |
| 409    | `PHONE_ALREADY_REGISTERED` | User already exists (verified account)                                       |
| 429    | `OTP_RATE_LIMITED`         | Resend too soon / too many SMS                                               |

---

### `POST /auth/otp/request` — login OTP or signup resend (no auth)

```json
{ "phone": "09123456789" }
```

**Success:** `{ "status": 200, "data": { "otpSent": true } }`

| Status | errorCode           | When                          |
| ------ | ------------------- | ----------------------------- |
| 400    | `INVALID_PHONE`     | Bad phone                     |
| 403    | `ACCOUNT_INACTIVE`  | User exists but not active    |
| 404    | `ACCOUNT_NOT_FOUND` | No user and no pending signup |
| 429    | `OTP_RATE_LIMITED`  | Cooldown / rate limit         |

---

### `POST /auth/otp/verify` — get JWT (no auth)

```json
{ "phone": "09123456789", "code": "123456" }
```

`code` must be length **6**.

**Success**

```json
{
  "status": 200,
  "data": {
    "accessToken": "<jwt>",
    "user": {}
  }
}
```

| Status | errorCode           | When                                             |
| ------ | ------------------- | ------------------------------------------------ |
| 400    | `VALIDATION`        | Code not 6 chars                                 |
| 400    | `INVALID_PHONE`     | Bad phone                                        |
| 401    | `INVALID_OTP`       | Wrong code                                       |
| 401    | `OTP_EXPIRED`       | TTL passed or too many attempts                  |
| 403    | `ACCOUNT_INACTIVE`  | Existing inactive user                           |
| 404    | `ACCOUNT_NOT_FOUND` | No user and pending signup gone (waited > ~120s) |

---

### `GET /auth/me` — current session

Header: `Authorization: Bearer <token>`

**Success:** `{ "status": 200, "data": <AuthUser> }`

---

### `POST /auth/logout`

Header: `Authorization: Bearer <token>`

**Success:** `{ "status": 200, "data": { "loggedOut": true } }`

Then drop the token on the client. Reusing it → `401 UNAUTHORIZED`.

---

### `PATCH /auth/sellers/me` — complete booth (seller JWT)

Buyers get `404 SELLER_NOT_FOUND`.

```json
{
  "shopName": "My Shop",
  "workplacePhone": "02123456789",
  "province": "Tehran",
  "city": "Tehran",
  "postalCode": "1234567890",
  "salesType": "STORE",
  "address": "Valiasr St."
}
```

| Field            | Required | Rules                         |
| ---------------- | -------- | ----------------------------- |
| `shopName`       | yes      | max 160                       |
| `province`       | yes      |                               |
| `city`           | yes      |                               |
| `salesType`      | yes      | `SUPERMARKET` \| `STORE`      |
| `address`        | yes      |                               |
| `workplacePhone` | no       |                               |
| `postalCode`     | no       | If set: **exactly 10 digits** |

**Success**

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "kind": "RETAIL",
    "status": "PENDING",
    "shopName": "My Shop",
    "profileComplete": true
  }
}
```

Does **not** activate the booth.

---

### `PATCH /admin/sellers/:id/status` — admin only

Requires JWT with role `ADMIN`. Other roles → `403 FORBIDDEN`.

```json
{ "status": "ACTIVE" }
```

`status`: `PENDING` | `ACTIVE` | `SUSPENDED` | `INACTIVE`

Allowed transitions:

| From        | To                      |
| ----------- | ----------------------- |
| `PENDING`   | `ACTIVE`, `INACTIVE`    |
| `ACTIVE`    | `SUSPENDED`, `INACTIVE` |
| `SUSPENDED` | `ACTIVE`, `INACTIVE`    |
| `INACTIVE`  | `ACTIVE`                |

`ACTIVE` while shop profile is incomplete → `400 SELLER_PROFILE_INCOMPLETE`.

**Success**

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "status": "ACTIVE",
    "kind": "RETAIL",
    "shopName": "My Shop"
  }
}
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
  imageKey: string | null; // frontend maps key → asset URL
  price: number; // tomans; retail or wholesale unit price by channel
  compareAtPrice: number | null;
  discountPercent: number;
  badges: string[]; // e.g. ["20%"]
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  seller: { id: number; shopName: string; logoKey: string | null };
  storeCount: number; // always 1 in this slice
  channel: 'RETAIL' | 'WHOLESALE';
};
```

Out-of-stock products stay visible. Unpublished / draft products are not returned (`404 PRODUCT_NOT_FOUND` on detail).

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
  gallery: Array<{ imageKey: string; alt: string | null; isPrimary: boolean; sortOrder: number }>;
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
3. Buyer signup = JSON; seller/both = `FormData` + `document`.
4. After signup, show OTP screen; **do not** expect a token.
5. OTP input: 6 digits, 120s timer, resend disabled 60s.
6. Store `accessToken`; send `Authorization: Bearer`.
7. On `401 UNAUTHORIZED`, clear token and go to login.
8. Seller home: if `seller.profileComplete === false`, force booth form; if `status !== "ACTIVE"`, show pending/suspended state — do not treat OTP as “shop approved”.
9. Gate admin screens on `roles.includes("ADMIN")`.
10. Prefer a Next.js rewrite until CORS exists.

---

## Not available yet

Seller product CRUD, inventory mutations, cart, orders, payments, notifications, tRPC, multi-seller comparison rows, external marketplace price feeds.

`GET /` is a leftover Nest hello-world, not a product API.

Swagger is configured in env (`SWAGGER_PATH=docs`) but **not mounted** in bootstrap yet — this file is the contract.
