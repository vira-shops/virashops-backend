/**
 * Auth API contract check (signup step1→OTP→step2, login OTP, me, logout).
 *
 * Flow under test:
 *   Login:  phone + OTP → JWT
 *   Signup: step1 (name + phone) → OTP → step2 (channel/accountType/role) → JWT
 *
 * Also covers:
 *   - Health envelope
 *   - Buyer / wholesale-buyer / seller / both
 *   - OTP resend, GET /auth/me, logout + denylist
 *   - PATCH /auth/sellers/me + admin seller status
 *   - Legacy POST /auth/signup (deprecated)
 *   - Errors: 400 VALIDATION, 401, 403, 404, 409, SELLER_PROFILE_INCOMPLETE
 *
 * Run:
 *   npm run auth-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml up -d postgres redis api --wait
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm auth-api-check
 *
 * Env: BASE_URL, OTP_DEV_CODE, ADMIN_PHONE
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import {
  authLoginTokens,
  envelopeStatus,
  unwrapApiData,
  unwrapError,
} from './utils/unwrap-api-data';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_FILE =
  process.env.AUTH_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'auth-api-check.json');
const RUN_ID = process.env.AUTH_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '09000000001';

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
  name: 'auth-api-check';
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
  name: 'auth-api-check',
  startedAt: new Date().toISOString(),
  finishedAt: '',
  success: false,
  baseUrl: BASE_URL,
  runId: RUN_ID,
  steps: [],
  endpointsChecklist: [
    { method: 'GET', path: '/health', auth: false, covered: true },
    { method: 'POST', path: '/auth/signup/step1', auth: false, covered: true },
    { method: 'POST', path: '/auth/signup/step2', auth: false, covered: true },
    { method: 'POST', path: '/auth/signup', auth: false, covered: true },
    { method: 'POST', path: '/auth/otp/request', auth: false, covered: true },
    { method: 'POST', path: '/auth/otp/verify', auth: false, covered: true },
    { method: 'POST', path: '/auth/logout', auth: true, covered: true },
    { method: 'GET', path: '/auth/me', auth: true, covered: true },
    { method: 'PATCH', path: '/auth/sellers/me', auth: true, covered: true },
    {
      method: 'PATCH',
      path: '/admin/sellers/:id/status',
      auth: true,
      covered: true,
    },
  ],
};

function logStep(step: Omit<StepResult, 'ok'> & { ok: boolean }): void {
  report.steps.push(step);
  const checks = step.checks
    ? ` [${Object.entries(step.checks)
        .map(([key, value]) => `${key}:${value ? '✓' : '✗'}`)
        .join(', ')}]`
    : '';
  console.log(
    `${step.ok ? '✓' : '✗'} Step ${step.step}: ${step.name}${
      step.status != null ? ` (${step.status})` : ''
    }${checks}`,
  );
}

function uniquePhone(slot: number): string {
  const n = (Number(String(Date.now()).slice(-8)) + slot * 17) % 100000000;
  const phone = `09${String(n).padStart(9, '0')}`;
  return phone === ADMIN_PHONE ? uniquePhone(slot + 11) : phone;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

function saveReport(): string {
  report.finishedAt = new Date().toISOString();
  report.success = report.steps.every((step) => step.ok);
  mkdirSync(join(OUTPUT_FILE, '..'), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  return OUTPUT_FILE;
}

/** Step2 seller/both multipart — no firstName/lastName (forbidNonWhitelisted). */
function sellerStep2Form(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  form.append(
    'document',
    new File([Buffer.from('fake-id')], 'id.jpg', { type: 'image/jpeg' }),
  );
  return form;
}

async function signupStep1(
  stepNum: number,
  name: string,
  firstName: string,
  lastName: string,
  phone: string,
): Promise<void> {
  await api(stepNum, name, 'POST', '/auth/signup/step1', {
    body: { firstName, lastName, phone },
    checks: (status, body) => {
      const data = unwrapApiData<{ otpSent?: boolean; accessToken?: string }>(
        body,
      );
      return {
        ...envelopeOk(status, body, 200),
        otpSent: data?.otpSent === true,
        noToken: data?.accessToken === undefined,
      };
    },
  });
}

async function verifyNeedsStep2(
  stepNum: number,
  name: string,
  phone: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  await api(stepNum, name, 'POST', '/auth/otp/verify', {
    body: { phone, code: OTP },
    checks: (status, body) => {
      const data = unwrapApiData<{
        needsStep2?: boolean;
        phone?: string;
        firstName?: string;
        lastName?: string;
        accessToken?: string;
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        needsStep2: data?.needsStep2 === true,
        phone: data?.phone === phone,
        firstName: data?.firstName === firstName,
        lastName: data?.lastName === lastName,
        noToken: data?.accessToken === undefined,
      };
    },
  });
}

async function main(): Promise<void> {
  console.log(`\nAuth API check → ${BASE_URL} (run ${RUN_ID})\n`);
  let step = 0;

  const buyerPhone = uniquePhone(1);
  const wholesalePhone = uniquePhone(2);
  const sellerPhone = uniquePhone(3);
  const bothPhone = uniquePhone(4);
  const legacyPhone = uniquePhone(5);

  await api(++step, 'Health', 'GET', '/health', {
    checks: (status, body) => {
      const data = unwrapApiData<{ status?: string }>(body);
      return {
        ...envelopeOk(status, body, 200),
        healthy: data?.status === 'ok',
      };
    },
  });

  await api(++step, 'Step1 validation error', 'POST', '/auth/signup/step1', {
    body: { phone: '0912' },
    expectStatus: 400,
    checks: (status, body) => errorOk(status, body, 400, 'VALIDATION'),
  });

  await api(++step, 'OTP request unknown phone', 'POST', '/auth/otp/request', {
    body: { phone: uniquePhone(9) },
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'ACCOUNT_NOT_FOUND'),
  });

  await api(++step, 'Me without token', 'GET', '/auth/me', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  await api(++step, 'Five-digit OTP rejected', 'POST', '/auth/otp/verify', {
    body: { phone: buyerPhone, code: '12345' },
    expectStatus: 400,
    checks: (status, body) => errorOk(status, body, 400, 'VALIDATION'),
  });

  // --- Retail buyer: step1 → OTP → step2 (role after OTP) ---
  await signupStep1(++step, 'Retail buyer step1', 'Ali', 'Buyer', buyerPhone);

  await sleep(1200);
  await api(++step, 'Signup OTP resend', 'POST', '/auth/otp/request', {
    body: { phone: buyerPhone },
  });

  await api(++step, 'Wrong OTP', 'POST', '/auth/otp/verify', {
    body: { phone: buyerPhone, code: '000000' },
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'INVALID_OTP'),
  });

  await verifyNeedsStep2(
    ++step,
    'Verify buyer OTP → needsStep2',
    buyerPhone,
    'Ali',
    'Buyer',
  );

  await api(++step, 'Step2 before OTP rejected', 'POST', '/auth/signup/step2', {
    body: {
      phone: uniquePhone(8),
      channel: 'RETAIL',
      accountType: 'BUYER',
      activityType: 'STORE',
      guildType: 'FOOD',
    },
    expectStatus: 400,
    checks: (status, body) => errorOk(status, body, 400, 'VALIDATION'),
  });

  const buyerStep2 = await api(
    ++step,
    'Retail buyer step2 (role)',
    'POST',
    '/auth/signup/step2',
    {
      body: {
        phone: buyerPhone,
        channel: 'RETAIL',
        accountType: 'BUYER',
        activityType: 'STORE',
        guildType: 'FOOD',
      },
      checks: (status, body) => {
        const data = unwrapApiData<{
          accessToken?: string;
          user?: { roles?: string[] };
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasToken: Boolean(data?.accessToken),
          retailBuyer: data?.user?.roles?.includes('RETAIL_BUYER') === true,
        };
      },
    },
  );
  const buyerToken = authLoginTokens(buyerStep2.body).accessToken;
  if (!buyerToken) {
    throw new Error('Buyer step2 did not return an access token');
  }

  await api(++step, 'Get buyer me', 'GET', '/auth/me', {
    token: buyerToken,
    checks: (status, body) => {
      const data = unwrapApiData<{
        phone?: string;
        roles?: string[];
        phoneVerified?: boolean;
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        phone: data?.phone === buyerPhone,
        verified: data?.phoneVerified === true,
        role: data?.roles?.includes('RETAIL_BUYER') === true,
      };
    },
  });

  await api(++step, 'Duplicate buyer step1', 'POST', '/auth/signup/step1', {
    body: {
      firstName: 'Ali',
      lastName: 'Buyer',
      phone: buyerPhone,
    },
    expectStatus: 409,
    checks: (status, body) =>
      errorOk(status, body, 409, 'PHONE_ALREADY_REGISTERED'),
  });

  await api(
    ++step,
    'Buyer forbidden on admin route',
    'PATCH',
    '/admin/sellers/1/status',
    {
      token: buyerToken,
      body: { status: 'ACTIVE' },
      expectStatus: 403,
      checks: (status, body) => errorOk(status, body, 403, 'FORBIDDEN'),
    },
  );

  await api(
    ++step,
    'Buyer has no seller profile',
    'PATCH',
    '/auth/sellers/me',
    {
      token: buyerToken,
      body: {
        shopName: 'Nope',
        province: 'Tehran',
        city: 'Tehran',
        salesType: 'STORE',
        address: 'Valiasr',
      },
      expectStatus: 404,
      checks: (status, body) => errorOk(status, body, 404, 'SELLER_NOT_FOUND'),
    },
  );

  await api(++step, 'Logout buyer', 'POST', '/auth/logout', {
    token: buyerToken,
    checks: (status, body) => {
      const data = unwrapApiData<{ loggedOut?: boolean }>(body);
      return {
        ...envelopeOk(status, body, 200),
        loggedOut: data?.loggedOut === true,
      };
    },
  });

  await api(++step, 'Denylisted token rejected', 'GET', '/auth/me', {
    token: buyerToken,
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  // --- Login: phone + OTP ---
  await api(++step, 'Buyer login OTP request', 'POST', '/auth/otp/request', {
    body: { phone: buyerPhone },
  });
  await api(++step, 'Buyer login OTP verify', 'POST', '/auth/otp/verify', {
    body: { phone: buyerPhone, code: OTP },
    checks: (status, body) => ({
      ...envelopeOk(status, body, 200),
      hasToken: Boolean(authLoginTokens(body).accessToken),
    }),
  });

  // --- Wholesale buyer ---
  await signupStep1(
    ++step,
    'Wholesale buyer step1',
    'Neda',
    'Wholesale',
    wholesalePhone,
  );
  await verifyNeedsStep2(
    ++step,
    'Verify wholesale OTP → needsStep2',
    wholesalePhone,
    'Neda',
    'Wholesale',
  );
  await api(++step, 'Wholesale buyer step2', 'POST', '/auth/signup/step2', {
    body: {
      phone: wholesalePhone,
      channel: 'WHOLESALE',
      accountType: 'BUYER',
      activityType: 'STORE',
      guildType: 'FOOD',
    },
    checks: (status, body) => {
      const data = unwrapApiData<{ user?: { roles?: string[] } }>(body);
      return {
        ...envelopeOk(status, body, 200),
        wholesaleBuyer: data?.user?.roles?.includes('WHOLESALE_BUYER') === true,
      };
    },
  });

  // --- Seller: step1 → OTP → step2 multipart ---
  await signupStep1(++step, 'Retail seller step1', 'Sara', 'Seller', sellerPhone);
  await verifyNeedsStep2(
    ++step,
    'Verify seller OTP → needsStep2',
    sellerPhone,
    'Sara',
    'Seller',
  );

  await api(++step, 'Seller step2 without document', 'POST', '/auth/signup/step2', {
    formData: (() => {
      const form = new FormData();
      form.append('phone', sellerPhone);
      form.append('channel', 'RETAIL');
      form.append('accountType', 'SELLER');
      form.append('activityType', 'STORE');
      form.append('industryType', 'FOOD');
      form.append('category', 'CANNED');
      return form;
    })(),
    expectStatus: 400,
    checks: (status, body) => errorOk(status, body, 400, 'VALIDATION'),
  });

  const sellerStep2 = await api(
    ++step,
    'Retail seller step2',
    'POST',
    '/auth/signup/step2',
    {
      formData: sellerStep2Form({
        phone: sellerPhone,
        channel: 'RETAIL',
        accountType: 'SELLER',
        activityType: 'STORE',
        industryType: 'FOOD',
        category: 'CANNED',
        documentType: 'NATIONAL_ID',
      }),
      checks: (status, body) => {
        const data = unwrapApiData<{
          accessToken?: string;
          user?: {
            roles?: string[];
            seller?: {
              id?: number;
              status?: string;
              profileComplete?: boolean;
            };
          };
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasToken: Boolean(data?.accessToken),
          retailSeller: data?.user?.roles?.includes('RETAIL_SELLER') === true,
          pending: data?.user?.seller?.status === 'PENDING',
          incomplete: data?.user?.seller?.profileComplete === false,
        };
      },
    },
  );
  const sellerToken = authLoginTokens(sellerStep2.body).accessToken;
  const sellerId = unwrapApiData<{
    user?: { seller?: { id?: number } };
  }>(sellerStep2.body)?.user?.seller?.id;
  if (!sellerToken || !sellerId) {
    throw new Error('Seller step2 did not return token and seller id');
  }

  const adminLogin = await api(
    ++step,
    'Admin OTP request',
    'POST',
    '/auth/otp/request',
    { body: { phone: ADMIN_PHONE } },
  );
  if (!adminLogin.ok) {
    throw new Error(
      'Admin OTP request failed — set ADMIN_PHONE and restart the API so admin seed runs',
    );
  }
  const adminVerify = await api(
    ++step,
    'Admin OTP verify',
    'POST',
    '/auth/otp/verify',
    {
      body: { phone: ADMIN_PHONE, code: OTP },
      checks: (status, body) => {
        const data = unwrapApiData<{ user?: { roles?: string[] } }>(body);
        return {
          ...envelopeOk(status, body, 200),
          admin: data?.user?.roles?.includes('ADMIN') === true,
        };
      },
    },
  );
  const adminToken = authLoginTokens(adminVerify.body).accessToken;
  if (!adminToken) {
    throw new Error('Admin verify did not return an access token');
  }

  await api(
    ++step,
    'Admin cannot activate incomplete seller',
    'PATCH',
    `/admin/sellers/${sellerId}/status`,
    {
      token: adminToken,
      body: { status: 'ACTIVE' },
      expectStatus: 400,
      checks: (status, body) =>
        errorOk(status, body, 400, 'SELLER_PROFILE_INCOMPLETE'),
    },
  );

  await api(++step, 'Complete seller profile', 'PATCH', '/auth/sellers/me', {
    token: sellerToken,
    body: {
      shopName: `Shop ${RUN_ID}`,
      province: 'Tehran',
      city: 'Tehran',
      salesType: 'STORE',
      address: 'Valiasr',
    },
    checks: (status, body) => {
      const data = unwrapApiData<{
        profileComplete?: boolean;
        shopName?: string;
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        complete: data?.profileComplete === true,
        shopName: typeof data?.shopName === 'string',
      };
    },
  });

  await api(
    ++step,
    'Admin activates seller',
    'PATCH',
    `/admin/sellers/${sellerId}/status`,
    {
      token: adminToken,
      body: { status: 'ACTIVE' },
      checks: (status, body) => {
        const data = unwrapApiData<{ status?: string }>(body);
        return {
          ...envelopeOk(status, body, 200),
          active: data?.status === 'ACTIVE',
        };
      },
    },
  );

  // --- Both (buyer + seller): role after OTP at step2 ---
  await signupStep1(++step, 'Both-account step1', 'Both', 'User', bothPhone);
  await verifyNeedsStep2(
    ++step,
    'Verify both OTP → needsStep2',
    bothPhone,
    'Both',
    'User',
  );
  await api(++step, 'Both-account step2', 'POST', '/auth/signup/step2', {
    formData: sellerStep2Form({
      phone: bothPhone,
      channel: 'WHOLESALE',
      accountType: 'BOTH',
      activityType: 'STORE',
      industryType: 'FOOD',
      category: 'CANNED',
      documentType: 'BUSINESS_LICENSE',
    }),
    checks: (status, body) => {
      const roles =
        unwrapApiData<{ user?: { roles?: string[] } }>(body)?.user?.roles ?? [];
      return {
        ...envelopeOk(status, body, 200),
        wholesaleBuyer: roles.includes('WHOLESALE_BUYER'),
        retailSeller: roles.includes('RETAIL_SELLER'),
        wholesaleSeller: roles.includes('WHOLESALE_SELLER'),
      };
    },
  });

  // --- Legacy signup (deprecated, still works) ---
  await api(++step, 'Legacy signup', 'POST', '/auth/signup', {
    body: {
      firstName: 'Legacy',
      lastName: 'User',
      phone: legacyPhone,
      channel: 'RETAIL',
      accountType: 'BUYER',
      activityType: 'STORE',
      guildType: 'FOOD',
    },
    checks: (status, body) => {
      const data = unwrapApiData<{ otpSent?: boolean }>(body);
      return {
        ...envelopeOk(status, body, 200),
        otpSent: data?.otpSent === true,
      };
    },
  });
  await api(++step, 'Legacy OTP verify → JWT', 'POST', '/auth/otp/verify', {
    body: { phone: legacyPhone, code: OTP },
    checks: (status, body) => ({
      ...envelopeOk(status, body, 200),
      hasToken: Boolean(authLoginTokens(body).accessToken),
    }),
  });

  const out = saveReport();
  console.log(
    `\n${report.success ? 'PASS' : 'FAIL'} — ${report.steps.filter((item) => item.ok).length}/${report.steps.length} steps`,
  );
  console.log(`Wrote ${out}`);
  if (!report.success) {
    process.exit(1);
  }
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
