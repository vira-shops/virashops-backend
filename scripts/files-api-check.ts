/**
 * Files + product images API contract check.
 *
 * Verifies:
 *   - POST /files/upload (JWT, multipart field `file`) returns key under uploads/
 *   - Catalog seller PUT /seller/products/:id/images attaches uploaded key
 *   - Public GET /products/:slug exposes imageUrl / gallery.url for stored keys
 *   - GET /files/download?key= returns a fresh url
 *   - Negatives: upload without auth 401; invalid mime 400; non-owner seller 403
 *   - Admin PUT /admin/products/:id/images still works
 *
 * Run:
 *   npm run files-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml up -d postgres redis api --wait
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm files-api-check
 *
 * Env: BASE_URL, OTP_DEV_CODE, ADMIN_PHONE
 * Seeded catalog seller phone: 09000000999 (owns product id 1 / pepsi-cola-6pk)
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import {
  authLoginTokens,
  envelopeStatus,
  isObject,
  unwrapApiData,
  unwrapError,
} from './utils/unwrap-api-data';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_FILE =
  process.env.FILES_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'files-api-check.json');
const RUN_ID = process.env.FILES_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '09000000001';
const CATALOG_SELLER_PHONE = '09000000999';
const PRODUCT_ID = 1;
const PRODUCT_SLUG = 'pepsi-cola-6pk';

/** Minimal valid JPEG (1x1) for FileTypeValidator magic-byte checks. */
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z',
  'base64',
);

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
  name: 'files-api-check';
  startedAt: string;
  finishedAt: string;
  success: boolean;
  baseUrl: string;
  runId: string;
  steps: StepResult[];
  endpointsChecklist: Array<{
    method: string;
    path: string;
    auth: boolean;
    covered: boolean;
  }>;
};

const report: Report = {
  name: 'files-api-check',
  startedAt: new Date().toISOString(),
  finishedAt: '',
  success: false,
  baseUrl: BASE_URL,
  runId: RUN_ID,
  steps: [],
  endpointsChecklist: [
    { method: 'POST', path: '/files/upload', auth: true, covered: true },
    { method: 'GET', path: '/files/download?key=', auth: true, covered: true },
    {
      method: 'PUT',
      path: '/seller/products/:id/images',
      auth: true,
      covered: true,
    },
    {
      method: 'PUT',
      path: '/admin/products/:id/images',
      auth: true,
      covered: true,
    },
    { method: 'GET', path: '/products/:slug', auth: false, covered: true },
  ],
};

function logStep(step: StepResult): void {
  report.steps.push(step);
  const mark = step.ok ? 'OK' : 'FAIL';
  console.log(`[${mark}] ${step.step}. ${step.name} (${step.status ?? '-'})`);
}

function envelopeOk(
  httpStatus: number,
  body: unknown,
  expected: number,
): Record<string, boolean> {
  const data = unwrapApiData(body);
  return {
    httpStatus: httpStatus === expected,
    envelopeStatus: envelopeStatus(body) === expected,
    hasData: data !== null && data !== undefined,
  };
}

function errorOk(
  httpStatus: number,
  body: unknown,
  expected: number,
  errorCode: string,
): Record<string, boolean> {
  const error = unwrapError(body);
  return {
    ...envelopeOk(httpStatus, body, expected),
    errorCode: error.errorCode === errorCode,
    hasMessage: Boolean(error.message),
  };
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
    checks?: (httpStatus: number, body: unknown) => Record<string, boolean>;
  } = {},
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const started = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body });
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }

  const expectStatus = opts.expectStatus ?? 200;
  const checks = opts.checks
    ? opts.checks(res.status, parsed)
    : envelopeOk(res.status, parsed, expectStatus);
  const ok = Object.values(checks).every(Boolean);
  logStep({
    step: stepNum,
    name,
    method,
    path,
    ok,
    status: res.status,
    request: opts.formData ? '[multipart]' : opts.body,
    response: parsed,
    checks,
    error: ok ? undefined : `expected ${expectStatus}, got ${res.status}`,
    durationMs: Date.now() - started,
  });
  return { ok, status: res.status, body: parsed };
}

function jpegForm(): FormData {
  const form = new FormData();
  form.append(
    'file',
    new File([TINY_JPEG], `product-${RUN_ID}.jpg`, { type: 'image/jpeg' }),
  );
  return form;
}

function textForm(): FormData {
  const form = new FormData();
  form.append(
    'file',
    new File([Buffer.from('not-an-image')], 'notes.txt', {
      type: 'text/plain',
    }),
  );
  return form;
}

async function login(phone: string, step: { n: number }): Promise<string> {
  const request = await api(
    ++step.n,
    `OTP request ${phone}`,
    'POST',
    '/auth/otp/request',
    { body: { phone } },
  );
  if (!request.ok) {
    throw new Error(`OTP request failed for ${phone}`);
  }
  const verify = await api(
    ++step.n,
    `OTP verify ${phone}`,
    'POST',
    '/auth/otp/verify',
    {
      body: { phone, code: OTP },
      checks: (status, body) => {
        const token = authLoginTokens(body).accessToken;
        return {
          ...envelopeOk(status, body, 200),
          hasAccessToken: Boolean(token),
        };
      },
    },
  );
  const token = authLoginTokens(verify.body).accessToken;
  if (!token) {
    throw new Error(`No access token for ${phone}`);
  }
  return token;
}

function saveReport(): string {
  report.finishedAt = new Date().toISOString();
  report.success = report.steps.every((step) => step.ok);
  mkdirSync(join(OUTPUT_FILE, '..'), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  return OUTPUT_FILE;
}

async function main(): Promise<void> {
  console.log(`files-api-check → ${BASE_URL} (run ${RUN_ID})`);
  const step = { n: 0 };

  await api(++step.n, 'Health', 'GET', '/health');

  await api(++step.n, 'Upload without auth', 'POST', '/files/upload', {
    formData: jpegForm(),
    expectStatus: 401,
    checks: (status, body) => ({
      httpStatus: status === 401,
      envelopeOrEmpty:
        status === 401 &&
        (envelopeStatus(body) === 401 || unwrapError(body).errorCode === 'UNAUTHORIZED' || !isObject(body)),
    }),
  });

  const sellerToken = await login(CATALOG_SELLER_PHONE, step);

  await api(++step.n, 'Reject text upload', 'POST', '/files/upload', {
    token: sellerToken,
    formData: textForm(),
    expectStatus: 400,
    checks: (status) => ({
      httpStatus: status === 400 || status === 422,
    }),
  });

  const upload = await api(++step.n, 'Seller upload JPEG', 'POST', '/files/upload', {
    token: sellerToken,
    formData: jpegForm(),
    checks: (status, body) => {
      const data = unwrapApiData<{ key?: string; url?: string }>(body);
      return {
        ...envelopeOk(status, body, 200),
        keyUploads: typeof data?.key === 'string' && data.key.startsWith('uploads/'),
        hasUrl: typeof data?.url === 'string' && data.url.length > 0,
      };
    },
  });
  const uploaded = unwrapApiData<{ key: string; url: string }>(upload.body);
  if (!uploaded?.key) {
    throw new Error('Upload did not return a key');
  }

  await api(
    ++step.n,
    'Seller attach product images',
    'PUT',
    `/seller/products/${PRODUCT_ID}/images`,
    {
      token: sellerToken,
      body: {
        images: [{ key: uploaded.key, isPrimary: true, altEn: 'Pepsi' }],
      },
      checks: (status, body) => {
        const data = unwrapApiData<{
          id?: number;
          images?: Array<{ imageKey?: string; url?: string | null }>;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          productId: data?.id === PRODUCT_ID,
          keyMatch: data?.images?.[0]?.imageKey === uploaded.key,
          hasUrl: typeof data?.images?.[0]?.url === 'string',
        };
      },
    },
  );

  await api(++step.n, 'Public product shows imageUrl', 'GET', `/products/${PRODUCT_SLUG}`, {
    checks: (status, body) => {
      const data = unwrapApiData<{
        imageKey?: string;
        imageUrl?: string | null;
        gallery?: Array<{ imageKey?: string; url?: string | null }>;
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        imageKey: data?.imageKey === uploaded.key,
        imageUrl: typeof data?.imageUrl === 'string' && data.imageUrl.length > 0,
        galleryUrl:
          data?.gallery?.[0]?.imageKey === uploaded.key &&
          typeof data.gallery[0].url === 'string',
      };
    },
  });

  await api(
    ++step.n,
    'Download presigned URL',
    'GET',
    `/files/download?key=${encodeURIComponent(uploaded.key)}`,
    {
      token: sellerToken,
      checks: (status, body) => {
        const data = unwrapApiData<{ url?: string; key?: string }>(body);
        return {
          ...envelopeOk(status, body, 200),
          key: data?.key === uploaded.key,
          url: typeof data?.url === 'string' && data.url.length > 0,
        };
      },
    },
  );

  // Non-owner: admin phone is not the catalog seller → 403 on seller route
  const adminToken = await login(ADMIN_PHONE, step);
  await api(
    ++step.n,
    'Admin cannot use seller products route',
    'PUT',
    `/seller/products/${PRODUCT_ID}/images`,
    {
      token: adminToken,
      body: { images: [{ key: uploaded.key }] },
      expectStatus: 403,
      checks: (status, body) => ({
        httpStatus: status === 403,
        forbidden:
          unwrapError(body).errorCode === 'FORBIDDEN' ||
          unwrapError(body).errorCode === 'SELLER_NOT_ACTIVE' ||
          status === 403,
      }),
    },
  );

  await api(
    ++step.n,
    'Admin override product images',
    'PUT',
    `/admin/products/${PRODUCT_ID}/images`,
    {
      token: adminToken,
      body: {
        images: [
          {
            key: uploaded.key,
            isPrimary: true,
            altEn: `admin-${RUN_ID}`,
          },
        ],
      },
      checks: (status, body) => {
        const data = unwrapApiData<{ images?: Array<{ imageKey?: string }> }>(
          body,
        );
        return {
          ...envelopeOk(status, body, 200),
          keyMatch: data?.images?.[0]?.imageKey === uploaded.key,
        };
      },
    },
  );

  const out = saveReport();
  console.log(`Report: ${out}`);
  if (!report.success) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  saveReport();
  process.exit(1);
});
