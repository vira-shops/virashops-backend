# HTTP API contract checks (Docker)

Reusable playbook for **live HTTP contract checks**: a TypeScript script hits a running API, asserts status codes and response shape, and writes a JSON report.

This is **not** a unit test and **not** Jest. The script talks to a real backend over HTTP (usually inside Docker Compose), using seeded credentials. Copy this layout into another service and keep the same names, env vars, and report format so runners stay interchangeable.

Reference implementation in this repo:

| Piece | Path |
| --- | --- |
| Check scripts | `scripts/<feature>-api-check.ts` |
| Shared unwrap helpers | `scripts/utils/unwrap-api-data.ts` |
| Test image + compose overlay | `Dockerfile` (`test` target), `docker-compose.test.yml` |
| App stack | `docker-compose.yml` |
| npm entry | `package.json` → `"<feature>-api-check"` |
| Reports | `test-results/<feature>-api-check.json` (gitignored) |

---

## 1. What a check is for

Use an API check when you need a **black-box contract** against a running server:

- Happy path for a resource (login → create → get → update).
- Error contracts (`404` + `errorCode`, `400` validation, `401` vs `404`).
- Envelope shape (`{ data, pagination }`), field types, path aliases.
- Multipart upload then using the returned URL/id.
- Auth roles (company / driver / admin) and OTP when the product requires it.

Do **not** use this for:

- Pure domain logic (use Jest unit tests).
- Schema/migration correctness (use `migration:run` / drift jobs).
- Load or soak testing.

A check **must fail the process** (`exit 1`) if any step is not `ok`. CI and humans both read the JSON report.

---

## 2. How Docker runs it

Two Compose files are stacked:

```text
docker-compose.yml              # postgis, redis, minio, backend, …
docker-compose.test.yml         # overlay: test image + one-shot check services
```

The check container:

1. Builds from `Dockerfile` **target `test`** (deps + source, **no** `pnpm build`; `ts-node` compiles on the fly).
2. Shares image tag `etmita-backend:test` (rename the image in your project).
3. Waits for `backend` **healthy** (`GET /health` → 200).
4. Calls the API at `BASE_URL=http://backend:3000` (Compose DNS, not localhost).
5. Writes the report under `/app/test-results/…`, bind-mounted to `./test-results` on the host.

Canonical service (copy and rename):

```yaml
# docker-compose.test.yml
  example-api-check:
    build:
      context: .
      dockerfile: Dockerfile
      target: test
    image: etmita-backend:test          # your test image name
    depends_on:
      backend:
        condition: service_healthy
    env_file:
      - .env
    environment:
      BASE_URL: http://backend:3000
      EXAMPLE_API_CHECK_OUTPUT: /app/test-results/example-api-check.json
    volumes:
      - .:/app
      - /app/node_modules
      - ./test-results:/app/test-results
    networks:
      - internal
    command: ["pnpm", "example-api-check"]
```

Always pass **both** files, overlay last:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm example-api-check
```

`BASE_URL` is the important env: inside Compose it must be `http://backend:3000`. On the host (no Docker) it defaults to `http://localhost:3000`.

### Test image (`Dockerfile` target)

```dockerfile
FROM node:22-alpine AS test
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
CMD ["pnpm", "test"]
```

The check service overrides `CMD` with `pnpm <feature>-api-check`.

### Backend overlay (test-only env)

`docker-compose.test.yml` may override `backend.environment` for checks that need short lock windows, fixed OTP, etc. Example from this repo:

```yaml
services:
  backend:
    environment:
      AUTH_LOGIN_LOCK_DURATION_SECONDS: "2"
      AUTH_LOGIN_MAX_ATTEMPTS: "5"
      AUTH_TEST_FIXED_OTP: "true"
      API_URL: http://localhost:3000
      APP_URL: http://localhost:3000
```

If a check depends on backend env (OTP, lock duration), **rebuild and recreate backend** before running the script. Changing only the check container is not enough.

---

## 3. Bring the stack up (first time)

Requires a gitignored `.env` (copy from `.env.example`) with DB, MinIO, and **seed credentials**.

```bash
# 1. Infra + API
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d postgis redis minio backend

# 2. Schema
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm migrate

# 3. Seed users / fixtures the checks log in as
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm seed

# After backend source changes:
docker compose -f docker-compose.yml -f docker-compose.test.yml build backend
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d backend
```

Seed passwords come from `SEED_COMPANY_EMAIL` / `SEED_COMPANY_PASSWORD` (and driver/admin equivalents). Scripts read them via `getSeedConfig()` — never hardcode credentials in the check.

---

## 4. Run a check

### Docker (preferred — same path as CI-style local runs)

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm <feature>-api-check
```

Rebuild the **check** image after `package.json` / lockfile changes, or when the service has **no bind mount** (see Windows note below):

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml build <feature>-api-check
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm <feature>-api-check
```

Rebuild **backend** after API behavior changes, then wait until healthy:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml build backend
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d backend
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm <feature>-api-check
```

### Host (API already on localhost:3000)

```bash
pnpm <feature>-api-check
```

Same script, `BASE_URL` defaults to `http://localhost:3000`. Credentials still come from `.env`.

### Pass / fail

- Console: `✓` / `✗` per step, then `PASS` or `FAIL — n/m steps`.
- File: `test-results/<feature>-api-check.json`.
- Process: exit `0` only if every step `ok === true`.

---

## 5. Add a check in another project (checklist)

Do these in order. Names must match **everywhere**.

| # | Artifact | Convention |
| --- | --- | --- |
| 1 | `scripts/<feature>-api-check.ts` | kebab-case; file name = npm script = Compose service |
| 2 | `package.json` script | `"<feature>-api-check": "ts-node -r tsconfig-paths/register scripts/<feature>-api-check.ts"` |
| 3 | Compose service in `docker-compose.test.yml` | service name = `<feature>-api-check` |
| 4 | Output env | `<FEATURE>_API_CHECK_OUTPUT` (screaming snake of the feature) |
| 5 | Optional run id | `<FEATURE>_API_CHECK_RUN_ID` |
| 6 | `.gitignore` | `/test-results` |
| 7 | Header comment on the script | what it covers + the exact `docker compose … run` command |

**Naming examples**

| Feature | Script | npm / Compose | Output env |
| --- | --- | --- | --- |
| auth | `scripts/auth-api-check.ts` | `auth-api-check` | `AUTH_API_CHECK_OUTPUT` |
| fleets | `scripts/fleets-api-check.ts` | `fleets-api-check` | `FLEETS_API_CHECK_OUTPUT` |
| mobile-trip | `scripts/mobile-trip-api-check.ts` | `mobile-trip-api-check` | `MOBILE_TRIP_API_CHECK_OUTPUT` |

Copy `scripts/utils/unwrap-api-data.ts` as-is if the API uses `{ data: T }` envelopes.

---

## 6. Script skeleton (copy this)

Keep the same types (`StepResult`, `Report`), `fetch` helper, `saveReport`, and `main().catch` so reports stay comparable across services.

```ts
/**
 * <Feature> API contract check.
 *
 * Verifies:
 *   - …
 *
 * Run:
 *   pnpm <feature>-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm <feature>-api-check
 *
 * Env: BASE_URL, SEED_COMPANY_EMAIL, SEED_COMPANY_PASSWORD
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

import { getSeedConfig } from '../src/config/seed.config';
import {
  authLoginTokens,
  isObject,
  unwrapApiData,
} from './utils/unwrap-api-data';

dotenv.config();
dotenv.config({ path: join(process.cwd(), '.env.development') });

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_FILE =
  process.env.FEATURE_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'feature-api-check.json');
const RUN_ID = process.env.FEATURE_API_CHECK_RUN_ID ?? Date.now().toString(36);

type StepResult = {
  step: number;
  name: string;
  method: string;
  path: string;
  ok: boolean;
  status?: number;
  request?: unknown;
  response?: unknown;
  checks?: Record<string, boolean>;
  error?: string;
  durationMs?: number;
};

type Report = {
  name: 'feature-api-check';
  startedAt: string;
  finishedAt: string;
  success: boolean;
  baseUrl: string;
  runId: string;
  steps: StepResult[];
};

const seed = getSeedConfig();
const report: Report = {
  name: 'feature-api-check',
  startedAt: new Date().toISOString(),
  finishedAt: '',
  success: false,
  baseUrl: BASE_URL,
  runId: RUN_ID,
  steps: [],
};

function logStep(step: Omit<StepResult, 'ok'> & { ok: boolean }): void {
  report.steps.push(step);
  const checks = step.checks
    ? ` [${Object.entries(step.checks)
        .map(([k, v]) => `${k}:${v ? '✓' : '✗'}`)
        .join(', ')}]`
    : '';
  console.log(
    `${step.ok ? '✓' : '✗'} Step ${step.step}: ${step.name}${
      step.status != null ? ` (${step.status})` : ''
    }${checks}`,
  );
}

async function api(
  stepNum: number,
  name: string,
  method: string,
  path: string,
  opts: {
    token?: string;
    body?: unknown;
    formData?: FormData;
    expectStatus?: number;
  } = {},
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body });
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }

  const expect =
    opts.expectStatus ?? (method === 'POST' ? 201 : 200);
  const ok = res.status === expect;
  logStep({
    step: stepNum,
    name,
    method,
    path,
    ok,
    status: res.status,
    request: opts.body,
    response: parsed,
    error: ok ? undefined : `expected ${expect}, got ${res.status}`,
  });
  return { ok, status: res.status, body: parsed };
}

function saveReport(): string {
  report.finishedAt = new Date().toISOString();
  report.success = report.steps.every((s) => s.ok);
  mkdirSync(join(OUTPUT_FILE, '..'), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  return OUTPUT_FILE;
}

async function main(): Promise<void> {
  console.log(`\nFeature API check → ${BASE_URL} (run ${RUN_ID})\n`);
  let step = 0;

  const login = await api(++step, 'Company login', 'POST', '/auth/login', {
    body: { email: seed.companyEmail, password: seed.companyPassword },
    expectStatus: 200,
  });
  const token = authLoginTokens(login.body).accessToken;
  if (!token) throw new Error('Company login failed');

  // … resource steps: assert status, then unwrapApiData() and field checks …

  const out = saveReport();
  console.log(
    `\n${report.success ? 'PASS' : 'FAIL'} — ${report.steps.filter((s) => s.ok).length}/${report.steps.length} steps`,
  );
  console.log(`Wrote ${out}`);
  if (!report.success) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  report.success = false;
  try {
    saveReport();
  } catch {
    /* still exit */
  }
  process.exit(1);
});
```

Replace `feature` / `FEATURE` / `Feature` with the real name.

### Assertions that are not HTTP

Add an extra step with `method: 'ASSERT'` (or `'CHECK'`):

```ts
logStep({
  step: ++step,
  name: 'List contains created id',
  method: 'ASSERT',
  path: '/resources',
  ok: found,
  checks: { found },
});
```

Prefer **named boolean checks** (`checks: { hasId: true, statusOpen: false }`) over a single opaque `ok`. The JSON report is the debug artifact.

---

## 7. Shared helpers (`scripts/utils/unwrap-api-data.ts`)

Keep these four functions in every project that uses `{ data }` envelopes:

| Function | Use |
| --- | --- |
| `isObject(v)` | Type guard before reading fields |
| `unwrapApiData<T>(body)` | `{ data: T }` → `T`, or the body if already flat |
| `unwrapDataList<T>(body)` | `{ data: T[] }` or a raw array |
| `authLoginTokens(body)` | `accessToken` / `refreshToken` after login |

Login tokens live **inside** `data`. Never read `body.accessToken` at the top level unless the API is actually flat.

---

## 8. Report JSON contract

Minimum fields every report should have:

```json
{
  "name": "feature-api-check",
  "startedAt": "2026-08-29T15:00:00.000Z",
  "finishedAt": "2026-08-29T15:00:08.000Z",
  "success": true,
  "baseUrl": "http://backend:3000",
  "runId": "abc123",
  "steps": [
    {
      "step": 1,
      "name": "Company login",
      "method": "POST",
      "path": "/auth/login",
      "ok": true,
      "status": 200
    }
  ]
}
```

Optional (use when they help the next person debug):

- `ids` — created resource ids
- `tokens` — do **not** commit reports; still avoid logging full tokens in CI logs
- `endpointsChecklist` — `{ method, path, auth, covered }` for FE/API coverage matrices
- `checks` on a step — named predicates

On unexpected throw, still write the report with `success: false` and whatever steps completed, then `process.exit(1)`.

---

## 9. Conventions that keep projects compatible

1. **One script = one Compose service = one npm script = one report file.** No combining unrelated resources in a single check unless they are one user flow.
2. **Talk HTTP only.** Do not import Nest modules or hit the DB unless a rare check truly cannot go through the API (document that exception in the header).
3. **Login with seed users**, then exercise the resource. Create throwaway records with a `RUN_ID` suffix so reruns do not collide.
4. **Assert error codes**, not only HTTP status, when the product has `errorCode` (e.g. `EMAIL_NOT_FOUND` vs `INVALID_CREDENTIALS`).
5. **Default expected status:** `201` for `POST`, `200` otherwise; override with `expectStatus` for `204`, `400`, `401`, `404`.
6. **Bind-mount source** so script edits run without rebuild: `.:/app` plus anonymous `/app/node_modules` so host `node_modules` cannot overwrite the image.
7. **Windows Docker Desktop:** some hosts fail bind-mounting certain drives. Those services omit volumes and write the report to `/tmp/…`. After script edits you **must** `docker compose … build <service>`.
8. **OTP / staff login:** set `AUTH_TEST_FIXED_OTP=true` on **backend**, and in the check container if the script reads it. Fixed code in this project is `000000`.
9. **Idempotence is best-effort.** Checks may leave rows behind. Prefer unique emails/names per `RUN_ID`. Do not require a wipe between runs unless documented.

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `fetch failed` / connection refused | Backend not up or `BASE_URL` wrong | Use `http://backend:3000` in Compose; wait for healthy |
| Login 401 | Seed missing or wrong `.env` | `run --rm seed`; confirm `SEED_COMPANY_PASSWORD` |
| Old API behavior | Backend image stale | `build backend` then `up -d backend` |
| Script change ignored | No bind mount, or Windows volume issue | `build <feature>-api-check` |
| Check passes, product still wrong | You asserted status only | Add `checks` on unwrapped `data` |
| OTP / lock tests flake | Backend overlay env not applied | Recreate backend after overlay change |
| Report missing on host | Output path not mounted | Set `*_OUTPUT` to `/app/test-results/…` and mount `./test-results` |

---

## 11. Checks in this repo

This service uses **npm** (not pnpm). The API Compose service is **`api`** (not `backend`). Routes are under `/api/v1` except `GET /health` and `/health/live`. Login/register bodies are **flat** (`user` + `tokens`), not `{ data }`.

| npm / Compose service | Script | Notes |
| --- | --- | --- |
| `auth-api-check` | `scripts/auth-api-check.ts` | Register, login, me, refresh/reuse, logout, password change/reset, host request, admin |
| `user-api-check` | `scripts/user-api-check.ts` | Traveler `/users/me/*`, phone OTP (`000000` when `AUTH_TEST_FIXED_OTP=true`), panel stubs |
| `host-api-check` | `scripts/host-api-check.ts` | Host `/host/me` (null / pending / approved), listing RBAC, profile, wallet stub |
| `property-api-check` | `scripts/property-api-check.ts` | Host listings CRUD/publication, spaces GET|PUT|POST|PATCH|DELETE, meta GET|PUT, location/nearby GET|PUT, images GET|POST|presign|complete|url|PATCH|cover|reorder|DELETE, admin approve → PUBLISHED public stay. |
| `amenities-geo-availability-api-check` | `scripts/amenities-geo-availability-api-check.ts` | Public amenity catalog, host amenity CRUD, geo tree/reverse, host location/nearby, host calendar block/unblock, seeded Kish/Ramsar public stay/calendar/availability. |

Bring-up and run:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d postgres redis api
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm migrate
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm auth-api-check
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm user-api-check
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm host-api-check
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm property-api-check
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm amenities-geo-availability-api-check
```

After API code changes, rebuild `api` so overlay env such as `AUTH_TEST_FIXED_OTP` is actually used by the running process:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml build api
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d api
```

Host fallback (API already on localhost:3000, with `AUTH_TEST_FIXED_OTP=true` on that process for OTP steps):

```bash
npm run auth-api-check
npm run user-api-check
npm run host-api-check
npm run property-api-check
npm run amenities-geo-availability-api-check
```

Related overlay one-shots: `migrate`. Admin credentials come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` via `getSeedConfig()`. Seeded host is `SEED_HOST_EMAIL` / `SEED_HOST_PASSWORD` (`host@jabama.local`). Traveler checks **register** unique emails per `RUN_ID` (admin has no `user` role, so `/users/me` and `/host/me` are `403 ACCESS_DENIED`).

---

## 12. Minimal port to a new repo

1. Multi-stage `Dockerfile` with a **`test`** target (install + copy source, skip production `build`).
2. `docker-compose.yml` with a healthy `backend` (or whatever the API service is named).
3. `docker-compose.test.yml` overlay: shared `image: …:test`, `depends_on` healthy API, `BASE_URL`, report volume.
4. `scripts/utils/unwrap-api-data.ts` + first `scripts/<feature>-api-check.ts`.
5. `pnpm` script using `ts-node -r tsconfig-paths/register`.
6. Seed (or fixture) user the check can log in as.
7. Document the four-line run block in the script header.

That is the whole structure. New features are a new file + npm script + Compose service with the same names.
