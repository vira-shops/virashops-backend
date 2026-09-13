# Frontend guide — Auth module

Contract for the Next.js app against this Nest API’s **auth** surface.

**Base URL (local):** `http://localhost:3000`  
**No `/api` prefix.** Paths are `/auth/...`, `/admin/sellers/...`.

Shared envelope, CORS/proxy, and language rules: [FRONTEND.md](./FRONTEND.md).

---

## Mental model

| Flow | Screens | When JWT appears |
| ---- | ------- | ---------------- |
| **Login** | phone → OTP | After OTP verify |
| **Signup** | name+phone → OTP → role/profile | After **step 2** (not after OTP) |

```
Login:   phone ──OTP──► JWT + user

Signup:  firstName + lastName + phone
            │
            ▼ OTP SMS
         verify OTP ──► { needsStep2: true }   ← no JWT, no roles yet
            │
            ▼
         step 2 (channel + accountType + …)
            │
            ▼
         JWT + user (roles assigned here)
```

**Role is chosen after OTP**, on step 2 (`channel` + `accountType`). Do not send `roles`.

---

## Screens to build

1. **Login** — phone → OTP → home  
2. **Signup step 1** — first name, last name, phone → OTP  
3. **OTP** — 6 digits (signup or login); resend  
4. **Signup step 2** — channel, account type, activity / guild or industry / category; seller document upload  
5. **Seller booth** (after seller/both signup) — `PATCH /auth/sellers/me` until `profileComplete`  
6. **Session** — persist token; `GET /auth/me` on load; logout  

---

## Auth basics

| | |
| - | - |
| Scheme | `Authorization: Bearer <accessToken>` |
| Token | JWT only. **No refresh.** Default ~**1 day** (`JWT_EXPIRES_IN`) |
| Payload (do not trust for authz) | `{ sub, phone, roles[], jti }` |
| Logout | Denylists this `jti`. Keep the token string to send on logout |
| Cookies | Not used |

Protected: `GET /auth/me`, `POST /auth/logout`, `PATCH /auth/sellers/me`, `PATCH /admin/sellers/:id/status`.

Missing / invalid / expired / denylisted → `401` `{ errorCode: "UNAUTHORIZED" }`.

---

## Phone

Backend normalizes and stores `09xxxxxxxxx`.

| Input | Stored |
| ----- | ------ |
| `09123456789` | `09123456789` |
| `9123456789` | `09123456789` |
| `+989123456789` / `989…` / `0098…` | `09123456789` |

Invalid → `400 INVALID_PHONE`.

Keep the **normalized** phone in client state across OTP and step 2 (same string for every call).

---

## Roles (assigned by backend on step 2)

**Channel** = which app surface (`RETAIL` \| `WHOLESALE`).  
**Account type** = what they register as (`BUYER` \| `SELLER` \| `BOTH`).

| `channel` | `accountType` | `roles` after step 2 | `user.seller` |
| --------- | ------------- | -------------------- | ------------- |
| `RETAIL` | `BUYER` | `RETAIL_BUYER` | `null` |
| `WHOLESALE` | `BUYER` | `WHOLESALE_BUYER` | `null` |
| `RETAIL` | `SELLER` | `RETAIL_BUYER`, `RETAIL_SELLER` | booth `kind: RETAIL` |
| `WHOLESALE` | `SELLER` | `WHOLESALE_BUYER`, `WHOLESALE_SELLER` | `WHOLESALE` |
| `RETAIL` | `BOTH` | `RETAIL_BUYER`, `RETAIL_SELLER`, `WHOLESALE_SELLER` | `BOTH` |
| `WHOLESALE` | `BOTH` | `WHOLESALE_BUYER`, `RETAIL_SELLER`, `WHOLESALE_SELLER` | `BOTH` |

Also: `ADMIN` (seed only — no public register).

**OTP does not approve a seller booth.** After seller/both step 2:

- `user.seller.status === "PENDING"`
- `user.seller.profileComplete === false`

Admin can set `ACTIVE` only after the seller completes the booth form.

User `accountStatus`: `ACTIVE` \| `INACTIVE` \| `SUSPENDED` (inactive → `403 ACCOUNT_INACTIVE`).  
Seller `status`: `PENDING` \| `ACTIVE` \| `SUSPENDED` \| `INACTIVE`.

---

## OTP rules

| Rule | Value |
| ---- | ----- |
| Length | Exactly **6** digit characters. `12345` → `400 VALIDATION` |
| TTL | **120 seconds** |
| Resend cooldown | **60 seconds** → `429 OTP_RATE_LIMITED` |
| Max SMS | **5 / 10 minutes** (same 429) |
| Max wrong verifies | **5** then `401 OTP_EXPIRED` |
| Pending signup TTL | **120s** (refreshed when OTP verify advances draft to step 2 — user must finish step 2 in time) |
| Production | SMS; code never in API body |
| Local/dev | If `OTP_DEV_CODE` is set (often `123456`), that code works; UI still collects 6 digits |

---

## User shape

Returned as `data.user` from OTP verify (**login** / **legacy signup**) and from **step 2**; also as `data` from `GET /auth/me`.

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
  fullName: string;
  roles: string[];
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  phoneVerified: boolean;
  activityType: string | null;
  guildType: string | null;
  seller: SellerSummary | null; // buyers: null
};

type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

/** Signup only — after OTP, before step 2 */
type NeedsStep2 = {
  needsStep2: true;
  phone: string;
  firstName: string;
  lastName: string;
};
```

Discriminate OTP verify responses:

```ts
function isNeedsStep2(data: AuthSession | NeedsStep2): data is NeedsStep2 {
  return 'needsStep2' in data && data.needsStep2 === true;
}
```

---

## Flows (implement these)

### Login (existing account)

1. `POST /auth/otp/request` `{ phone }`  
2. User enters code (timer 120s; resend disabled 60s → same endpoint)  
3. `POST /auth/otp/verify` `{ phone, code }` → `{ accessToken, user }`  
4. Store token; on app load call `GET /auth/me`

Unknown phone (no user, no pending signup) → `404 ACCOUNT_NOT_FOUND` → offer signup.

### Signup (current — use this)

1. **Step 1** — `POST /auth/signup/step1`  
   `{ firstName, lastName, phone }` → `{ otpSent: true }`  
   **No JWT.** Show OTP screen.

2. **OTP** — `POST /auth/otp/verify` `{ phone, code }`  
   → `{ needsStep2: true, phone, firstName, lastName }`  
   **Still no JWT.** Go to step 2 form (prefill names from response).

3. **Step 2** — choose role/profile:  
   - Buyer: JSON `POST /auth/signup/step2`  
   - Seller / both: `multipart/form-data` + file field `document`  
   → `{ accessToken, user }` with roles set.

4. If `user.seller` and `!profileComplete` → booth form (`PATCH /auth/sellers/me`).  
5. Gate seller commerce UI on `seller.status === "ACTIVE"` **and** `profileComplete`.

**Resend during signup OTP:** `POST /auth/otp/request` `{ phone }` (pending draft must still exist).

**Step 2 without verifying OTP** (or expired draft) → `400 VALIDATION`.

### Seller / both after step 2

1. Token already issued by step 2  
2. `PATCH /auth/sellers/me` → `profileComplete: true` (still `PENDING`)  
3. Admin later activates booth  
4. Do **not** treat OTP or step 2 as “shop approved”

### Deprecated: `POST /auth/signup`

Legacy single-shot signup (all fields + OTP, then JWT on verify). Still works for now — **do not use in new UI.** Prefer step1 → OTP → step2.

---

## Endpoints

All successes below are HTTP **200**. JSON unless noted. Extra fields → `400 VALIDATION` (`forbidNonWhitelisted`).

### `POST /auth/signup/step1` — name + phone, send OTP

```json
{
  "firstName": "Sara",
  "lastName": "Karimi",
  "phone": "09123456789"
}
```

| Field | Required | Rules |
| ----- | -------- | ----- |
| `firstName` | yes | string, 2–80 |
| `lastName` | yes | string, 2–80 |
| `phone` | yes | Iranian mobile |

**Success**

```json
{ "status": 200, "data": { "otpSent": true } }
```

| Status | errorCode | When |
| ------ | --------- | ---- |
| 400 | `VALIDATION` | Bad / missing / extra fields |
| 400 | `INVALID_PHONE` | Not Iranian mobile |
| 409 | `PHONE_ALREADY_REGISTERED` | Offer login |
| 429 | `OTP_RATE_LIMITED` | Cooldown / SMS cap |

---

### `POST /auth/otp/request` — login OTP or signup resend

```json
{ "phone": "09123456789" }
```

**Success:** `{ "status": 200, "data": { "otpSent": true } }`

| Status | errorCode | When |
| ------ | --------- | ---- |
| 400 | `INVALID_PHONE` | Bad phone |
| 403 | `ACCOUNT_INACTIVE` | User exists but inactive |
| 404 | `ACCOUNT_NOT_FOUND` | No user and no pending signup |
| 429 | `OTP_RATE_LIMITED` | Cooldown / rate limit |

---

### `POST /auth/otp/verify` — login JWT **or** signup “go to step 2”

```json
{ "phone": "09123456789", "code": "123456" }
```

`code` length must be **6**.

**Login / legacy completed signup — success**

```json
{
  "status": 200,
  "data": {
    "accessToken": "<jwt>",
    "user": { /* AuthUser */ }
  }
}
```

**New signup after step 1 — success (no token)**

```json
{
  "status": 200,
  "data": {
    "needsStep2": true,
    "phone": "09123456789",
    "firstName": "Sara",
    "lastName": "Karimi"
  }
}
```

| Status | errorCode | When |
| ------ | --------- | ---- |
| 400 | `VALIDATION` | Code not 6 chars |
| 400 | `INVALID_PHONE` | Bad phone |
| 401 | `INVALID_OTP` | Wrong code |
| 401 | `OTP_EXPIRED` | TTL / too many attempts |
| 403 | `ACCOUNT_INACTIVE` | Existing inactive user |
| 404 | `ACCOUNT_NOT_FOUND` | No user and pending gone |

---

### `POST /auth/signup/step2` — role + profile → JWT

Call **only after** OTP returned `needsStep2: true`.

**Do not send** `firstName` / `lastName` (already from step 1; extra fields fail validation).

#### Buyer — JSON

```http
POST /auth/signup/step2
Content-Type: application/json

{
  "phone": "09123456789",
  "channel": "RETAIL",
  "accountType": "BUYER",
  "activityType": "GROCERY",
  "guildType": "FOOD"
}
```

#### Seller / both — multipart

```http
POST /auth/signup/step2
Content-Type: multipart/form-data

phone: 09123456780
channel: RETAIL
accountType: SELLER
activityType: STORE
industryType: FOOD
category: SNACKS
documentType: NATIONAL_ID
document: <file>
```

| Field | Buyer | Seller / both |
| ----- | ----- | ------------- |
| `phone` | required | required |
| `channel` | `RETAIL` \| `WHOLESALE` | same |
| `accountType` | `BUYER` | `SELLER` \| `BOTH` |
| `activityType` | required | required |
| `guildType` | required | not required |
| `industryType` | — | required |
| `category` | — | required (seller industry label, **not** catalog category id) |
| `documentType` | — | optional: `NATIONAL_ID` \| `BUSINESS_LICENSE` (default `BUSINESS_LICENSE`) |
| `document` | — | **required** file field name `document` |

**Document MIME:** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

**Browser example (seller)**

```ts
const form = new FormData();
form.append('phone', phone);
form.append('channel', 'RETAIL');
form.append('accountType', 'SELLER');
form.append('activityType', activityType);
form.append('industryType', industryType);
form.append('category', category);
form.append('documentType', 'NATIONAL_ID');
form.append('document', file); // File from <input type="file">

await fetch('/backend/auth/signup/step2', { method: 'POST', body: form });
// Do not set Content-Type manually — browser sets boundary
```

**Success**

```json
{
  "status": 200,
  "data": {
    "accessToken": "<jwt>",
    "user": { /* AuthUser with roles; seller may be PENDING */ }
  }
}
```

| Status | errorCode | When |
| ------ | --------- | ---- |
| 400 | `VALIDATION` | Missing fields, bad MIME, no document, OTP not verified, draft expired |
| 400 | `INVALID_PHONE` | Bad phone |

---

### `GET /auth/me`

Header: `Authorization: Bearer <token>`

**Success:** `{ "status": 200, "data": <AuthUser> }`

---

### `POST /auth/logout`

Header: `Authorization: Bearer <token>`

**Success:** `{ "status": 200, "data": { "loggedOut": true } }`

Drop the token locally. Reuse → `401 UNAUTHORIZED`.

---

### `PATCH /auth/sellers/me` — complete booth

Seller JWT required. Buyers → `404 SELLER_NOT_FOUND`.

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

| Field | Required | Rules |
| ----- | -------- | ----- |
| `shopName` | yes | max 160 |
| `province` | yes | |
| `city` | yes | |
| `salesType` | yes | `SUPERMARKET` \| `STORE` |
| `address` | yes | |
| `workplacePhone` | no | |
| `postalCode` | no | If set: **exactly 10 digits** |

**Success** — booth still `PENDING`; does **not** activate:

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

---

### `PATCH /admin/sellers/:id/status` — admin only

JWT with `ADMIN`. Others → `403 FORBIDDEN`.

```json
{ "status": "ACTIVE" }
```

`status`: `PENDING` \| `ACTIVE` \| `SUSPENDED` \| `INACTIVE`

| From | To |
| ---- | -- |
| `PENDING` | `ACTIVE`, `INACTIVE` |
| `ACTIVE` | `SUSPENDED`, `INACTIVE` |
| `SUSPENDED` | `ACTIVE`, `INACTIVE` |
| `INACTIVE` | `ACTIVE` |

`ACTIVE` while `profileComplete === false` → `400 SELLER_PROFILE_INCOMPLETE`.

---

## Auth error codes (UI)

| errorCode | HTTP | UI action |
| --------- | ---- | --------- |
| `VALIDATION` | 400 | Field errors / `details` |
| `INVALID_PHONE` | 400 | Fix mobile |
| `SELLER_PROFILE_INCOMPLETE` | 400 | Admin: booth not filled |
| `UNAUTHORIZED` | 401 | Clear token → login |
| `INVALID_OTP` | 401 | Wrong code |
| `OTP_EXPIRED` | 401 | Request a new code |
| `FORBIDDEN` | 403 | Wrong role |
| `ACCOUNT_INACTIVE` | 403 | Account disabled |
| `ACCOUNT_NOT_FOUND` | 404 | Login: unknown phone; or signup draft expired → restart step 1 |
| `SELLER_NOT_FOUND` | 404 | Buyer hit seller route |
| `PHONE_ALREADY_REGISTERED` | 409 | Offer login |
| `OTP_RATE_LIMITED` | 429 | Wait ~60s (or longer if SMS cap) |

Branch on **`errorCode`**, not translated `message`. Prefer `Accept-Language: fa` for Persian copy.

---

## Client checklist

1. Base URL **without** `/api` (e.g. Next rewrite `/backend/*` → API).  
2. Always unwrap `body.data`; switch on `errorCode`.  
3. **Signup:** step1 → OTP → step2. Role only on step 2.  
4. After step1 / OTP in signup: **no** `accessToken` until step 2.  
5. OTP UI: 6 digits, 120s timer, resend disabled 60s.  
6. Buyer step2 = JSON; seller/both step2 = `FormData` + `document` (no `firstName`/`lastName`).  
7. Store `accessToken`; send `Authorization: Bearer`.  
8. On `401 UNAUTHORIZED`, clear token → login.  
9. Seller: force booth if `!profileComplete`; pending/suspended if `status !== "ACTIVE"`.  
10. Admin screens: `roles.includes("ADMIN")`.  

---

## Suggested client state (signup)

```ts
type SignupDraft = {
  phone: string;
  firstName: string;
  lastName: string;
  otpVerified: boolean; // true after needsStep2
};
```

After step 2 success, replace with session `{ accessToken, user }` and clear the draft.
