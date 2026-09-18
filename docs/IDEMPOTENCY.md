# Idempotency

Playbook for safe retries on write APIs. Implement from this file when a use case can create a duplicate side effect (order, payment, refund, coupon, reservation).

Architecture rules still apply: [ARCHITECTURE.md](./ARCHITECTURE.md). Frontend contract rules still apply: [FRONTEND.md](./FRONTEND.md).

Idempotency does **not** mean “the request arrives only once”. It means arriving more than once with the same logical intent does **not** create a second order, charge, refund, or reservation.

---

## Why this repo needs it

A client can send the same checkout twice without meaning to:

1. The request reaches Nest and the order/payment is persisted.
2. The response never arrives (timeout, proxy retry, dropped mobile network).
3. The app or the user sends the request again.

Disabling the button in Next.js is not enough. Reverse proxies, queue redelivery, and double-submit all bypass UI guards. The guarantee lives next to the write, in PostgreSQL.

`GET`, `PUT`, and `DELETE` are already idempotent in HTTP. `POST` (and tRPC mutations) that create money or stock movement are not. Those must be designed as idempotent in the application.

---

## Where it is required

Apply when the handler has a **costly or irreversible side effect**. Do not put it on every `POST`.

| When we build | Operation | Idempotency | Extra uniqueness |
| -------------- | --------- | ----------- | ---------------- |
| `orders` | Place / checkout | **Required** | One order per successful key |
| `payments` | Initiate charge, capture, wallet top-up | **Required** | Provider payment id unique |
| `payments` | Refund | **Required** | Provider refund id unique |
| `payments` | Provider webhook | **Required** | Inbox unique on `eventId` |
| coupons / wallet debit | Redeem, apply credit | **Required** | |
| inventory | Reserve / commit outside the order transaction | **Required** | |
| `orders` | Buyer cancel | Recommended | |
| notifications | Send SMS / email after order | Recommended | Dedupe on `eventId` |
| `carts` | Add / update / remove line | No | Retry is a new intent or a overwrite |
| catalog, search, files GET | Reads | No | Safe methods |
| `POST /files/upload` | Upload | No | Object key is already unique |
| auth OTP request / verify | OTP | No | Redis TTL + rate limit already own this |
| `PATCH` seller booth, product images | Updates | No unless a write is not naturally idempotent |

**Rule of thumb:** if a second identical `POST` would charge, decrement stock, emit a notification, or insert a new aggregate, require an `Idempotency-Key`.

Do not implement a global interceptor. Opt in per route with `@RequireIdempotency()`.

Carts, orders, and payments are **not wired yet**. Add the shared kernel (table, port, interceptor) in the same slice as the first required mutation — likely `POST /orders` / checkout — not as a standalone feature.

---

## HTTP contract (frontend)

Header name is `Idempotency-Key` (case-insensitive).

```
POST /orders
Authorization: Bearer <accessToken>
Idempotency-Key: 01JZ8F9D8M5W8Y2A6PK3HNT7QC
Content-Type: application/json
```

| Client rule | Detail |
| ----------- | ------ |
| Generate | UUID v4 or ULID per **logical** action (one checkout, one pay click) |
| Retry | Reuse the **same** key and the **same** body |
| New action | New key. Never reuse a successful key for a different cart / amount |
| Persist | Keep the key in client memory (or sessionStorage) until success or a terminal conflict |
| Length | 8–100 chars, `[A-Za-z0-9_-]+` |
| Missing on a required route | `400` `IDEMPOTENCY_KEY_REQUIRED` |
| Same key, different body | `409` `IDEMPOTENCY_KEY_REUSED` |
| Same key, still running | `409` `IDEMPOTENCY_IN_PROGRESS` — wait and retry with the same key |
| Same key, already succeeded | **Replay** the original success (`201`/`200`) and the same `data` (same order id) |

Replay must use the existing envelope: `{ status, data }`. HTTP status always matches `body.status`. Do not invent a second payload.

Safe methods (`GET`) ignore the header.

When tRPC is wired, the same header (or procedure input field) maps to the same port. Do not duplicate the table.

---

## Architecture (this repo)

PostgreSQL owns durable truth. Redis owns short-lived coordination. Nest interceptors are presentation, not domain.

```
HTTP / tRPC (RequireIdempotency + interceptor)
  → IdempotencyService (application, shared)
      → IdempotencyRepositoryPort
           ▲
           └── Drizzle adapter + UNIQUE(actor, endpoint, key)
      → optional IdempotencyLockPort (Redis SET NX)
  → then the real use case (PlaceOrder, ChargePayment, …)
```

| Layer | Responsibility |
| ----- | -------------- |
| Decorator + interceptor | Read header, hash body, skip or replay, never contain order/payment rules |
| Application service | `reserve` / `complete` / `fail` / `release` |
| Port | Persistence contract |
| Drizzle adapter | `INSERT … ON CONFLICT DO NOTHING`, unique constraint |
| Redis adapter (optional) | 30s lock so a second request fails fast while the first is `processing` |
| Domain of orders/payments | Still enforce **their own** unique columns (provider ids). The interceptor is not the only lock |

The interceptor **must not** inject `DRIZZLE`. It injects `IDEMPOTENCY_SERVICE` (or the repository port). Domain models stay free of Nest HTTP and Drizzle.

Do not keep a Postgres transaction open while calling a payment provider. Reserve the idempotency row, commit, run the use case, then `complete`. For events after commit, use a transactional outbox later — not a long transaction around HTTP.

---

## Folder layout

Cross-cutting shared kernel, same pattern as JWT / OTP / envelope interceptor.

```
src/modules/shared/
  domain/
    model/enums/idempotency-status.enum.ts
    errors/idempotency-key-required.error.ts
    errors/idempotency-key-reused.error.ts
    errors/idempotency-in-progress.error.ts
    application/services/idempotency.service.ts
    application/services/idempotency.service.spec.ts
  application/ports/idempotency.repository.port.ts
  application/ports/idempotency.lock.port.ts          # optional Redis
  infrastructure/drizzle/schema/idempotency-records.ts
  infrastructure/drizzle/mappers/idempotency.mapper.ts
  infrastructure/drizzle/repositories/idempotency.repository.adapter.ts
  infrastructure/redis/redis-idempotency-lock.adapter.ts
  interface/http/decorators/require-idempotency.decorator.ts
  interface/http/interceptors/idempotency.interceptor.ts
```

Tokens in `src/modules/shared/tokens/port.tokens.ts`:

```ts
export const IDEMPOTENCY_REPOSITORY = Symbol('IDEMPOTENCY_REPOSITORY');
export const IDEMPOTENCY_LOCK = Symbol('IDEMPOTENCY_LOCK');
```

Export the interceptor from `CoreInfrastructureModule`. Apply it globally **or** as `APP_INTERCEPTOR`, but **no-op** unless the handler has `@RequireIdempotency()`. Same metadata pattern as `@Roles()`.

```ts
export const IDEMPOTENCY_KEY = 'idempotency';
const RequireIdempotency = () => SetMetadata(IDEMPOTENCY_KEY, true);
```

Example when orders exist:

```ts
@Post()
@UseGuards(JwtAuthGuard)
@RequireIdempotency()
async place(@Req() req: Request, @Body() dto: PlaceOrderHttpDto) {
  const cmd = PlaceOrderMapper.toCommand(dto, req.user.getId());
  const order = await this.placeOrder.execute(cmd);
  return ApiResponse.created(PlaceOrderMapper.toResponse(order));
}
```

`JwtAuthGuard` runs **before** interceptors, so `request.user` is set.

---

## PostgreSQL table

The unique constraint is the real guarantee. `SELECT` then `INSERT` races under concurrency. Two overlapping checkouts with one key must serialize in the database, not in a Node `Map`.

```ts
// infrastructure/drizzle/schema/idempotency-records.ts
export const idempotencyRecords = pgTable(
  'idempotency_records',
  {
    id: idColumn(),
    ...timestamps(),
    actorType: varchar('actor_type', { length: 16 }).notNull(), // user | guest | system
    actorId: varchar('actor_id', { length: 64 }).notNull(),     // String(userId) | guest id | provider
    endpoint: varchar('endpoint', { length: 150 }).notNull(),   // `POST:/orders`
    idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull(),
    requestHash: varchar('request_hash', { length: 64 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('processing'),
    statusCode: integer('status_code'),
    responseBody: jsonb('response_body'),
    resourceId: varchar('resource_id', { length: 64 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    unique('UQ_idempotency_actor_endpoint_key').on(
      table.actorType,
      table.actorId,
      table.endpoint,
      table.idempotencyKey,
    ),
    index('IDX_idempotency_expires_at').on(table.expiresAt),
  ],
);
```

Export the table from `src/database/schema.ts`. Generate a migration. Do **not** import this schema from `orders` or `payments` domain.

`actorId` is `varchar` because guests and webhooks are not `users.id`. For logged-in buyers use `actorType = 'user'` and `actorId = String(user.getId())`. This project’s users are integer serials, not UUIDs.

Default TTL: **24 hours**. After expiry, `reserve` may reset the row (same unique key) so a new logical action can reuse a leftover client key. Until then the first result wins.

---

## Request hash

Store SHA-256 of the **effective** body so the same key cannot create order A and later be reused to replay as order B.

1. Canonicalize JSON (stable key order) before hashing. `{a:1,b:2}` and `{b:2,a:1}` are the same intent.
2. Hash only fields the use case cares about. Do not include `Accept-Language`, `x-lang`, or random client metadata.
3. If `record.requestHash !== currentHash` → `IdempotencyKeyReusedError` (`409`).

```ts
createHash('sha256').update(stableStringify(request.body ?? {})).digest('hex');
```

---

## Record statuses

| Status | Meaning | Second request |
| ------ | ------- | -------------- |
| `processing` | First request owns the work | `409 IDEMPOTENCY_IN_PROGRESS` (or wait if you add polling) |
| `completed` | Side effect done; `responseBody` + `statusCode` stored | Replay stored envelope. Do not run the use case |
| `failed` | Handler threw after reserve; **no** durable side effect assumed | Same key + **same hash** may `reserve` again. Different hash → `409` |
| expired (`expires_at < now()`) | Row no longer blocks | Treat as absent; reset on conflict |

### What to persist on error

| Outcome | Action |
| ------- | ------ |
| Success | `complete(id, statusCode, envelope.data, resourceId)` |
| `400` validation / `401` / `403` (no write) | `release(id)` — delete the row so the client can fix the body and retry the same key |
| Unexpected `5xx` / timeout / provider blip | `fail(id)` — allow retry with the **same** key and hash |
| Business rejection **after** a write (rare) | `complete` with that error envelope only if replaying it is correct; otherwise put uniqueness on the aggregate |

Never `complete` a validation error. Replaying `400` would trap a client that then sends a corrected body under the same key (`IDEMPOTENCY_KEY_REUSED`).

---

## Reserve algorithm (atomic)

```
INSERT INTO idempotency_records (…, status = 'processing', expires_at = now() + 24h)
ON CONFLICT (actor_type, actor_id, endpoint, idempotency_key)
DO NOTHING
RETURNING *;
```

| Result | Meaning |
| ------ | ------- |
| Row returned | This request is the **owner**. Run `next.handle()`. |
| No row | Someone already inserted. `SELECT` it. |

Then:

1. Expired → reset to `processing` with the new hash (`UPDATE … WHERE id = $id AND expires_at < now()`). If the update hits 0 rows, another owner won — treat as in progress.
2. `requestHash` mismatch → `IdempotencyKeyReusedError`.
3. `completed` → return stored `{ status: statusCode, data: responseBody }` (envelope interceptor already pass-throughs this shape).
4. `processing` and not owner → `IdempotencyInProgressError`.
5. `failed` and same hash → this request becomes owner (`UPDATE status = 'processing'`). Run the handler again.

`INSERT … ON CONFLICT` is required. A unique constraint without it still needs this path so the loser does not throw `500`.

---

## Interceptor (presentation)

Do **not** copy the article’s `tap(async …)`. `tap` does not await. If `complete` runs after the response is flushed, a retry can miss the stored body and start a second order.

```ts
return next.handle().pipe(
  mergeMap((body) =>
    from(
      this.idempotency.complete(record.id, statusCode, unwrapData(body)).then(
        () => body,
      ),
    ),
  ),
  catchError((err) =>
    from(this.idempotency.onHandlerError(record.id, err).then(() => {
      throw err;
    })),
  ),
);
```

`onHandlerError` maps `DomainError` subclasses: validation-like → `release`, otherwise → `fail`. Re-throw so `DomainExceptionFilter` still renders `{ status, data: { errorCode, message } }`.

Throw `DomainError` subclasses from the interceptor, not Nest `BadRequestException` / `ConflictException`. Add codes + i18n strings:

| class | `ErrorCode` | HTTP |
| ----- | ----------- | ---- |
| `IdempotencyKeyRequiredError` | `IDEMPOTENCY_KEY_REQUIRED` | 400 |
| `IdempotencyKeyReusedError` | `IDEMPOTENCY_KEY_REUSED` | 409 |
| `IdempotencyInProgressError` | `IDEMPOTENCY_IN_PROGRESS` | 409 |

Add the same keys to `src/i18n/en/errors.json` and `src/i18n/fa/errors.json`.

Endpoint identity: `` `${method}:${route.path}` `` (Nest `request.route.path`, not the raw URL, so `/orders/1` does not explode cardinality). Webhooks use a stable name e.g. `WEBHOOK:payments/zarinpal`.

Missing user on a required buyer route: that is an auth bug (`JwtAuthGuard` should have run). Guest checkout, when added, must pass a stable `guestId` (cookie / header) as `actorId`.

---

## Redis (optional, never the source of truth)

Skill rule: Redis is cache, sessions, and async coordination — **not** commerce truth. Restart, eviction, or TTL expiry can drop a Redis key. Payments and orders still need the unique row.

Use Redis only to fail fast:

```
SET idem:{actorType}:{actorId}:{endpoint}:{key} {token} NX EX 30
```

| Rule | Why |
| ---- | --- |
| Random token as value | Only the owner deletes the lock (`GET` then `DEL` if token matches) |
| `EX` ≈ worst-case handler time | Avoid a stuck lock after a crash (`processing` row + TTL still protect) |
| Do not skip Postgres if Redis is down | Fail open to Postgres reserve, or fail the request — never “no lock, run twice” |

OTP already uses Redis. Do not overload that adapter. New port: `IdempotencyLockPort`.

---

## Domain uniqueness (still required)

The interceptor prevents duplicate **handler execution**. The bounded context still needs its own invariants:

| Context | Extra constraint |
| ------- | ---------------- |
| Payments | Unique `provider_ref` / gateway tracking id. Reconcile periodically |
| Orders | Do not create two `PAID` orders for one checkout key even if interceptor is bypassed (admin, job) |
| Webhooks / queue | Inbox table `UNIQUE(event_id)` — brokers redeliver |
| Coupons | Unique `(coupon_id, user_id)` when single-use |

Jobs and consumers do not go through the HTTP interceptor. They need the inbox unique key, not the header.

---

## Mistakes we will not ship

| Mistake | What to do instead |
| ------- | ------------------ |
| `SELECT` existence then `INSERT` with no unique constraint | Unique + `ON CONFLICT DO NOTHING` |
| One key for the whole session | New key per checkout / pay / refund |
| Key only, no request hash | Hash the canonical body |
| `Map` / in-process lock | Many Nest instances; memory is not shared |
| Redis as the only store for charges | Postgres unique row is mandatory |
| `tap(async complete)` | `mergeMap` / `from(promise)` so complete finishes before the response |
| Open a DB transaction around the payment HTTP call | Reserve → commit → provider → `complete`. Outbox for events |
| Global interceptor on all `POST` | `@RequireIdempotency()` only |
| Business rules in the interceptor | Interceptor only reserve/replay; prices and stock stay in the use case |
| Storing `400` as `completed` | `release` so the client can correct the body |

---

## Implementation checklist

Copy this into the slice that first needs it (orders / payments).

```
- [ ] 1. Requirement — which route; actor (user / guest / webhook); TTL 24h
- [ ] 2. Module — shared kernel, not a new bounded context
- [ ] 3. Domain — IdempotencyStatus; three DomainError classes; ErrorCode + i18n
- [ ] 4. Application — IdempotencyService.reserve / complete / fail / release
- [ ] 5. Ports — IDEMPOTENCY_REPOSITORY; optional IDEMPOTENCY_LOCK
- [ ] 6. Adapter — Drizzle schema + unique; ON CONFLICT reserve; optional Redis NX lock
- [ ] 7. API — @RequireIdempotency on the mutation; interceptor; document header in FRONTEND.md
- [ ] 8. Tests — unit service (mock port); integration concurrent inserts; HTTP two POSTs one order
- [ ] 9. Review — no Drizzle in interceptor; no Redis-only path for money; complete() is awaited
```

---

## Tests (minimum)

1. **Unit** (`idempotency.service.spec.ts`): mock the port. Cover owner vs replay vs hash mismatch vs in-progress vs release on validation.
2. **Integration** (`idempotency.repository.adapter.int-spec.ts`): real Postgres. Ten concurrent `reserve` with one key → exactly one owner.
3. **HTTP / e2e** (when the route exists): two sequential `POST /orders` with the same key → one row in `orders`, second response matches the first `data.id`. Same key, mutated body → `409 IDEMPOTENCY_KEY_REUSED`. Missing header → `400 IDEMPOTENCY_KEY_REQUIRED`. Parallel requests → one `201` and the rest `409 IDEMPOTENCY_IN_PROGRESS` or a replay of the same order, never two orders.

Do not only test sequential happy path. The bug is the race.

---

## Frontend notes (when the route ships)

Update [FRONTEND.md](./FRONTEND.md) in the same PR as the first idempotent endpoint:

- Required header table
- Error codes above
- Client: generate key on “Pay” / “Place order” click, not on page load (a refresh should be a new attempt **only** if the user starts a new checkout)
- Retry libraries (fetch retry, axios) must forward the same header

Until carts/orders/payments exist, this file is the spec — do not add dead interceptors.

---

## Companion patterns (later, not this slice)

- **Transactional outbox** — persist “order placed” event in the same Postgres transaction as the order, publish after commit. Stops lost messages; does not replace idempotency.
- **Inbox / dedupe** for webhooks and Bull jobs — `UNIQUE(event_id)`.
- **Payment reconciliation** — gateway ids + periodic comparison. Idempotency keys expire; provider ids do not.

Do not add Kafka or extra brokers for this. The modular monolith + Postgres unique constraint is enough.
