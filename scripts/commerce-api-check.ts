/**
 * Commerce API contract check (addresses, cart/invoices, shipping, checkout, payments, orders).
 *
 * Verifies:
 *   - Wholesale buyer signup → JWT
 *   - Addresses CRUD + 401 / 404
 *   - Cart add/update/clear with invoice grouping, commission, prepayment
 *   - Shipping methods + quote (+ bad method)
 *   - Checkout session per seller invoice
 *   - Payments initiate (Idempotency-Key), replay, missing key, reused body
 *   - mark-paid → Order + cart seller lines cleared
 *
 * Run:
 *   npm run commerce-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml up -d postgres redis api --wait
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm commerce-api-check
 *
 * Env: BASE_URL, OTP_DEV_CODE
 * Seeded product: id 1 / pepsi-cola-6pk (migration 0003_products)
 */

import { randomBytes } from 'crypto';
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
  process.env.COMMERCE_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'commerce-api-check.json');
const RUN_ID = process.env.COMMERCE_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const PRODUCT_ID = 1;
const PRODUCT_SLUG = 'pepsi-cola-6pk';

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
  name: 'commerce-api-check';
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
  name: 'commerce-api-check',
  startedAt: new Date().toISOString(),
  finishedAt: '',
  success: false,
  baseUrl: BASE_URL,
  runId: RUN_ID,
  steps: [],
  endpointsChecklist: [
    { method: 'GET', path: '/addresses', auth: true, covered: false },
    { method: 'POST', path: '/addresses', auth: true, covered: false },
    { method: 'PUT', path: '/addresses/:id', auth: true, covered: false },
    { method: 'DELETE', path: '/addresses/:id', auth: true, covered: false },
    { method: 'GET', path: '/cart', auth: true, covered: false },
    { method: 'POST', path: '/cart/items', auth: true, covered: false },
    { method: 'PATCH', path: '/cart/items/:itemId', auth: true, covered: false },
    { method: 'DELETE', path: '/cart/items/:itemId', auth: true, covered: false },
    { method: 'DELETE', path: '/cart', auth: true, covered: false },
    { method: 'GET', path: '/shipping/methods', auth: true, covered: false },
    { method: 'POST', path: '/shipping/quote', auth: true, covered: false },
    { method: 'POST', path: '/checkout', auth: true, covered: false },
    { method: 'GET', path: '/checkout/:id', auth: true, covered: false },
    { method: 'GET', path: '/payments/methods', auth: true, covered: false },
    { method: 'POST', path: '/payments/initiate', auth: true, covered: false },
    {
      method: 'POST',
      path: '/payments/:id/mark-paid',
      auth: true,
      covered: false,
    },
    { method: 'GET', path: '/orders', auth: true, covered: false },
    { method: 'GET', path: '/orders/:id', auth: true, covered: false },
  ],
};

function markCovered(method: string, path: string): void {
  const entry = report.endpointsChecklist.find(
    (item) => item.method === method && item.path === path,
  );
  if (entry) {
    entry.covered = true;
  }
}

function logStep(step: StepResult): void {
  report.steps.push(step);
  const mark = step.ok ? 'OK' : 'FAIL';
  console.log(`[${mark}] ${step.step}. ${step.name} (${step.status ?? '-'})`);
}

function uniquePhone(slot: number): string {
  const n = (Number(String(Date.now()).slice(-8)) + slot * 17) % 100000000;
  return `09${String(n).padStart(9, '0')}`;
}

function idempotencyKey(label: string): string {
  return `${label}_${RUN_ID}_${randomBytes(4).toString('hex')}`.slice(0, 100);
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
    headers?: Record<string, string>;
    expectStatus?: number;
    checks?: (httpStatus: number, body: unknown) => Record<string, boolean>;
    checklistPath?: string;
  } = {},
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers ?? {}),
  };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
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
    request: opts.body,
    response: parsed,
    checks,
    error: ok ? undefined : `expected ${expectStatus}, got ${res.status}`,
    durationMs: Date.now() - started,
  });
  if (ok && opts.checklistPath) {
    markCovered(method, opts.checklistPath);
  }
  return { ok, status: res.status, body: parsed };
}

function saveReport(): string {
  report.finishedAt = new Date().toISOString();
  report.success = report.steps.every((step) => step.ok);
  mkdirSync(join(OUTPUT_FILE, '..'), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  return OUTPUT_FILE;
}

async function signupWholesaleBuyer(step: { n: number }): Promise<string> {
  const phone = uniquePhone(21);
  await api(++step.n, 'auth.wholesale-buyer.step1', 'POST', '/auth/signup/step1', {
    body: { firstName: 'Commerce', lastName: 'Buyer', phone },
    checks: (status, body) => {
      const data = unwrapApiData<{ otpSent?: boolean }>(body);
      return {
        ...envelopeOk(status, body, 200),
        otpSent: data?.otpSent === true,
      };
    },
  });

  await api(
    ++step.n,
    'auth.wholesale-buyer.otp',
    'POST',
    '/auth/otp/verify',
    {
      body: { phone, code: OTP },
      checks: (status, body) => {
        const data = unwrapApiData<{ needsStep2?: boolean }>(body);
        return {
          ...envelopeOk(status, body, 200),
          needsStep2: data?.needsStep2 === true,
        };
      },
    },
  );

  const step2 = await api(
    ++step.n,
    'auth.wholesale-buyer.step2',
    'POST',
    '/auth/signup/step2',
    {
      body: {
        phone,
        channel: 'WHOLESALE',
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
          hasToken: typeof data?.accessToken === 'string',
          wholesaleBuyer:
            data?.user?.roles?.includes('WHOLESALE_BUYER') === true,
        };
      },
    },
  );

  const token =
    authLoginTokens(step2.body).accessToken ??
    unwrapApiData<{ accessToken?: string }>(step2.body)?.accessToken;
  if (!token) {
    throw new Error('Wholesale buyer signup did not return accessToken');
  }
  return token;
}

type CartView = {
  id: number;
  invoices: Array<{
    sellerId: number;
    items: Array<{
      id: number;
      productId: number;
      packQty: number;
      pieceQty: number;
      commissionPercent: number;
      lineTotal: number;
      prepaymentAmount: number;
    }>;
    summary: { grandTotal: number; commission: number };
  }>;
  summary: { grandTotal: number };
};

type QuoteView = {
  method: string;
  amount: number;
  availableDates: string[];
  windows: Array<{ startHour: number; endHour: number }>;
};

type CheckoutView = {
  id: number;
  sellerId: number;
  summary: {
    prepaymentTotal: number;
    shippingFee: number;
    payableAmount: number;
  };
};

type PaymentInitiateView = {
  id?: number;
  paymentId: number;
  kind: string;
  redirectUrl: string | null;
  status: string;
};

async function main(): Promise<void> {
  console.log(`\ncommerce-api-check → ${BASE_URL} (run ${RUN_ID})\n`);
  const step = { n: 0 };

  await api(++step.n, 'health', 'GET', '/health', {
    checks: (status, body) => {
      const data = unwrapApiData<{ status?: string }>(body);
      return {
        ...envelopeOk(status, body, 200),
        healthy: data?.status === 'ok',
      };
    },
  });

  const token = await signupWholesaleBuyer(step);

  const product = await api(
    ++step.n,
    'catalog.product',
    'GET',
    `/products/${PRODUCT_SLUG}?channel=WHOLESALE`,
    {
      checks: (status, body) => {
        const data = unwrapApiData<{
          id?: number;
          seller?: { id?: number };
          wholesale?: unknown;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          productId: data?.id === PRODUCT_ID,
          hasSeller: typeof data?.seller?.id === 'number',
          hasWholesale: data?.wholesale != null,
        };
      },
    },
  );
  const productData = unwrapApiData<{ seller?: { id: number } }>(product.body);
  const sellerId = productData?.seller?.id;
  if (!sellerId) {
    throw new Error('Product seller id missing');
  }

  // --- Addresses ---
  await api(++step.n, 'addresses.unauthorized', 'GET', '/addresses', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  const createdAddress = await api(
    ++step.n,
    'addresses.create',
    'POST',
    '/addresses',
    {
      token,
      body: {
        label: 'انبار تست',
        line1: 'خیابان ولیعصر',
        line2: 'پلاک ۱',
        city: 'تهران',
        province: 'تهران',
        postalCode: '1234567890',
        recipientFullName: 'حسین حیدری',
        recipientPhone: '09121234567',
        nationalId: '0012345678',
        houseNumber: '1',
        isDefault: true,
      },
      expectStatus: 201,
      checks: (status, body) => {
        const data = unwrapApiData<{ id?: number; label?: string }>(body);
        return {
          ...envelopeOk(status, body, 201),
          hasId: typeof data?.id === 'number',
          label: data?.label === 'انبار تست',
        };
      },
    },
  );
  markCovered('POST', '/addresses');
  const addressId = unwrapApiData<{ id: number }>(createdAddress.body)?.id;
  if (!addressId) {
    throw new Error('Address id missing');
  }

  await api(++step.n, 'addresses.list', 'GET', '/addresses', {
    token,
    checklistPath: '/addresses',
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ id: number }>>(body);
      return {
        ...envelopeOk(status, body, 200),
        includesCreated:
          Array.isArray(data) && data.some((row) => row.id === addressId),
      };
    },
  });

  await api(++step.n, 'addresses.update', 'PUT', `/addresses/${addressId}`, {
    token,
    body: {
      label: 'فروشگاه تست',
      line1: 'خیابان انقلاب',
      city: 'تهران',
      province: 'تهران',
      isDefault: true,
    },
    checklistPath: '/addresses/:id',
    checks: (status, body) => {
      const data = unwrapApiData<{ label?: string }>(body);
      return {
        ...envelopeOk(status, body, 200),
        label: data?.label === 'فروشگاه تست',
      };
    },
  });

  await api(
    ++step.n,
    'addresses.not-found',
    'PUT',
    '/addresses/99999999',
    {
      token,
      body: {
        label: 'x',
        line1: 'y',
        city: 'تهران',
        province: 'تهران',
      },
      expectStatus: 404,
      checks: (status, body) => errorOk(status, body, 404, 'ADDRESS_NOT_FOUND'),
    },
  );

  await api(
    ++step.n,
    'addresses.delete',
    'DELETE',
    `/addresses/${addressId}`,
    {
      token,
      checklistPath: '/addresses/:id',
      checks: (status, body) => envelopeOk(status, body, 200),
    },
  );
  markCovered('DELETE', '/addresses/:id');

  const address2 = await api(
    ++step.n,
    'addresses.create-for-checkout',
    'POST',
    '/addresses',
    {
      token,
      body: {
        label: 'انبار چک‌اوت',
        line1: 'خیابان آزادی',
        city: 'تهران',
        province: 'تهران',
        isDefault: true,
      },
      expectStatus: 201,
      checks: (status, body) => {
        const data = unwrapApiData<{ id?: number }>(body);
        return {
          ...envelopeOk(status, body, 201),
          hasId: typeof data?.id === 'number',
        };
      },
    },
  );
  const checkoutAddressId = unwrapApiData<{ id: number }>(address2.body)?.id;
  if (!checkoutAddressId) {
    throw new Error('Checkout address id missing');
  }

  // --- Cart ---
  await api(++step.n, 'cart.unauthorized', 'GET', '/cart', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  await api(++step.n, 'cart.clear', 'DELETE', '/cart', {
    token,
    checks: (status, body) => {
      const data = unwrapApiData<CartView>(body);
      return {
        ...envelopeOk(status, body, 200),
        emptyInvoices: Array.isArray(data?.invoices) && data.invoices.length === 0,
      };
    },
  });
  markCovered('DELETE', '/cart');

  await api(++step.n, 'cart.get-empty', 'GET', '/cart', {
    token,
    checklistPath: '/cart',
    checks: (status, body) => {
      const data = unwrapApiData<CartView>(body);
      return {
        ...envelopeOk(status, body, 200),
        hasInvoicesArray: Array.isArray(data?.invoices),
        empty: data?.invoices?.length === 0,
      };
    },
  });

  await api(++step.n, 'cart.add-invalid-qty', 'POST', '/cart/items', {
    token,
    body: { productId: PRODUCT_ID, packQty: 0, pieceQty: 0 },
    expectStatus: 400,
    checks: (status, body) =>
      errorOk(status, body, 400, 'INVALID_CART_QUANTITY'),
  });

  await api(++step.n, 'cart.add-unknown-product', 'POST', '/cart/items', {
    token,
    body: { productId: 99999999, packQty: 1, pieceQty: 0 },
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'PRODUCT_NOT_FOUND'),
  });

  const added = await api(++step.n, 'cart.add-item', 'POST', '/cart/items', {
    token,
    body: {
      productId: PRODUCT_ID,
      packQty: 1,
      pieceQty: 0,
      channel: 'WHOLESALE',
    },
    expectStatus: 201,
    checklistPath: '/cart/items',
    checks: (status, body) => {
      const data = unwrapApiData<CartView>(body);
      const invoice = data?.invoices?.find((row) => row.sellerId === sellerId);
      const item = invoice?.items?.[0];
      return {
        ...envelopeOk(status, body, 201),
        hasInvoice: Boolean(invoice),
        commissionPercent: item?.commissionPercent === 5,
        lineTotalInt: Number.isInteger(item?.lineTotal),
        productMatch: item?.productId === PRODUCT_ID,
      };
    },
  });
  markCovered('POST', '/cart/items');

  let cart = unwrapApiData<CartView>(added.body);
  let itemId = cart?.invoices
    ?.find((row) => row.sellerId === sellerId)
    ?.items?.[0]?.id;
  if (!itemId) {
    throw new Error('Cart item id missing after add');
  }

  const lineTotal =
    cart?.invoices?.find((row) => row.sellerId === sellerId)?.items?.[0]
      ?.lineTotal ?? 0;

  await api(
    ++step.n,
    'cart.update-item',
    'PATCH',
    `/cart/items/${itemId}`,
    {
      token,
      body: {
        packQty: 2,
        pieceQty: 0,
        prepaymentAmount: Math.min(lineTotal, Math.floor(lineTotal / 2) || lineTotal),
      },
      checklistPath: '/cart/items/:itemId',
      checks: (status, body) => {
        const data = unwrapApiData<CartView>(body);
        const item = data?.invoices
          ?.find((row) => row.sellerId === sellerId)
          ?.items?.[0];
        return {
          ...envelopeOk(status, body, 200),
          packQty: item?.packQty === 2,
          hasPrepayment: typeof item?.prepaymentAmount === 'number',
        };
      },
    },
  );
  markCovered('PATCH', '/cart/items/:itemId');

  const invoices = await api(++step.n, 'cart.get-invoices', 'GET', '/cart', {
    token,
    checks: (status, body) => {
      const data = unwrapApiData<CartView>(body);
      const invoice = data?.invoices?.find((row) => row.sellerId === sellerId);
      return {
        ...envelopeOk(status, body, 200),
        hasInvoice: Boolean(invoice),
        hasSummary: typeof data?.summary?.grandTotal === 'number',
        invoiceSummary: typeof invoice?.summary?.grandTotal === 'number',
      };
    },
  });
  cart = unwrapApiData<CartView>(invoices.body);
  itemId = cart?.invoices
    ?.find((row) => row.sellerId === sellerId)
    ?.items?.[0]?.id;
  if (!itemId) {
    throw new Error('Cart item id missing before shipping');
  }

  // remove + re-add so DELETE /cart/items/:id is covered before checkout
  await api(
    ++step.n,
    'cart.remove-item',
    'DELETE',
    `/cart/items/${itemId}`,
    {
      token,
      checklistPath: '/cart/items/:itemId',
      checks: (status, body) => envelopeOk(status, body, 200),
    },
  );
  markCovered('DELETE', '/cart/items/:itemId');

  const reAdded = await api(
    ++step.n,
    'cart.re-add-before-checkout',
    'POST',
    '/cart/items',
    {
      token,
      body: {
        productId: PRODUCT_ID,
        packQty: 2,
        pieceQty: 0,
        channel: 'WHOLESALE',
        prepaymentAmount: Math.floor(lineTotal),
      },
      expectStatus: 201,
      checks: (status, body) => {
        const data = unwrapApiData<CartView>(body);
        const item = data?.invoices
          ?.find((row) => row.sellerId === sellerId)
          ?.items?.[0];
        return {
          ...envelopeOk(status, body, 201),
          packQty: item?.packQty === 2,
          hasItemId: typeof item?.id === 'number',
        };
      },
    },
  );
  cart = unwrapApiData<CartView>(reAdded.body);
  itemId = cart?.invoices
    ?.find((row) => row.sellerId === sellerId)
    ?.items?.[0]?.id;
  if (!itemId) {
    throw new Error('Cart item id missing after re-add');
  }

  // --- Shipping ---
  await api(++step.n, 'shipping.methods', 'GET', '/shipping/methods', {
    token,
    checklistPath: '/shipping/methods',
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ name?: string }>>(body);
      const names = Array.isArray(data)
        ? data.map((row) => row.name)
        : [];
      return {
        ...envelopeOk(status, body, 200),
        express: names.includes('EXPRESS_COURIER'),
        post: names.includes('IRAN_POST'),
      };
    },
  });
  markCovered('GET', '/shipping/methods');

  await api(++step.n, 'shipping.bad-method', 'POST', '/shipping/quote', {
    token,
    body: {
      sellerId,
      addressId: checkoutAddressId,
      method: 'NOT_A_METHOD',
    },
    expectStatus: 400,
    checks: (status, body) => {
      const error = unwrapError(body);
      return {
        httpStatus: status === 400,
        envelopeStatus: envelopeStatus(body) === 400,
        errorCode:
          error.errorCode === 'VALIDATION' ||
          error.errorCode === 'SHIPPING_METHOD_UNAVAILABLE',
        hasMessage: Boolean(error.message),
      };
    },
  });

  const quoteRes = await api(
    ++step.n,
    'shipping.quote-express',
    'POST',
    '/shipping/quote',
    {
      token,
      body: {
        sellerId,
        addressId: checkoutAddressId,
        method: 'EXPRESS_COURIER',
      },
      checklistPath: '/shipping/quote',
      checks: (status, body) => {
        const data = unwrapApiData<QuoteView>(body);
        return {
          ...envelopeOk(status, body, 200),
          method: data?.method === 'EXPRESS_COURIER',
          amountInt: Number.isInteger(data?.amount),
          hasDates:
            Array.isArray(data?.availableDates) &&
            data.availableDates.length > 0,
          hasWindows:
            Array.isArray(data?.windows) && data.windows.length > 0,
        };
      },
    },
  );
  markCovered('POST', '/shipping/quote');
  const quote = unwrapApiData<QuoteView>(quoteRes.body);
  if (!quote?.availableDates?.[0] || !quote.windows?.[0]) {
    throw new Error('Shipping quote missing dates/windows');
  }
  const deliveryDate = quote.availableDates[0];
  const window = quote.windows[0];

  // --- Checkout ---
  await api(++step.n, 'checkout.bad-address', 'POST', '/checkout', {
    token,
    body: {
      sellerId,
      addressId: 99999999,
      shippingMethod: 'EXPRESS_COURIER',
      deliveryDate,
      windowStartHour: window.startHour,
      windowEndHour: window.endHour,
    },
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'ADDRESS_NOT_FOUND'),
  });

  const checkoutRes = await api(
    ++step.n,
    'checkout.start',
    'POST',
    '/checkout',
    {
      token,
      body: {
        sellerId,
        addressId: checkoutAddressId,
        shippingMethod: 'EXPRESS_COURIER',
        deliveryDate,
        windowStartHour: window.startHour,
        windowEndHour: window.endHour,
        note: 'commerce-api-check',
      },
      expectStatus: 201,
      checklistPath: '/checkout',
      checks: (status, body) => {
        const data = unwrapApiData<CheckoutView>(body);
        const payable =
          (data?.summary?.prepaymentTotal ?? 0) +
          (data?.summary?.shippingFee ?? 0);
        return {
          ...envelopeOk(status, body, 201),
          hasId: typeof data?.id === 'number',
          sellerMatch: data?.sellerId === sellerId,
          payableMatch: data?.summary?.payableAmount === payable,
        };
      },
    },
  );
  markCovered('POST', '/checkout');
  const checkout = unwrapApiData<CheckoutView>(checkoutRes.body);
  const checkoutSessionId = checkout?.id;
  if (!checkoutSessionId) {
    throw new Error('Checkout session id missing');
  }

  await api(
    ++step.n,
    'checkout.get',
    'GET',
    `/checkout/${checkoutSessionId}`,
    {
      token,
      checklistPath: '/checkout/:id',
      checks: (status, body) => {
        const data = unwrapApiData<CheckoutView>(body);
        return {
          ...envelopeOk(status, body, 200),
          sameId: data?.id === checkoutSessionId,
          samePayable:
            data?.summary?.payableAmount === checkout?.summary?.payableAmount,
        };
      },
    },
  );
  markCovered('GET', '/checkout/:id');

  // Empty-seller checkout: clear cart then attempt (after we captured session)
  // Keep cart for payment path — re-add if cleared. For CART_EMPTY we use wrong seller.
  await api(++step.n, 'checkout.empty-seller-cart', 'POST', '/checkout', {
    token,
    body: {
      sellerId: 99999999,
      addressId: checkoutAddressId,
      shippingMethod: 'EXPRESS_COURIER',
      deliveryDate,
      windowStartHour: window.startHour,
      windowEndHour: window.endHour,
    },
    expectStatus: 400,
    checks: (status, body) => errorOk(status, body, 400, 'CART_EMPTY'),
  });

  // --- Payments ---
  await api(++step.n, 'payments.methods', 'GET', '/payments/methods', {
    token,
    checklistPath: '/payments/methods',
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ name?: string }>>(body);
      const names = Array.isArray(data) ? data.map((row) => row.name) : [];
      return {
        ...envelopeOk(status, body, 200),
        online: names.includes('ONLINE'),
        cheque: names.includes('CHEQUE'),
        payroll: names.includes('PAYROLL'),
        lc: names.includes('CREDIT_LC'),
      };
    },
  });
  markCovered('GET', '/payments/methods');

  const payBody = {
    checkoutSessionId,
    method: 'ONLINE',
    callbackUrl: 'https://app.example/payments/callback',
  };
  const payKey = idempotencyKey('pay');

  await api(++step.n, 'payments.idempotency-missing', 'POST', '/payments/initiate', {
    token,
    body: payBody,
    expectStatus: 400,
    checks: (status, body) =>
      errorOk(status, body, 400, 'IDEMPOTENCY_KEY_REQUIRED'),
  });

  const initiated = await api(
    ++step.n,
    'payments.initiate',
    'POST',
    '/payments/initiate',
    {
      token,
      body: payBody,
      headers: { 'Idempotency-Key': payKey },
      expectStatus: 201,
      checklistPath: '/payments/initiate',
      checks: (status, body) => {
        const data = unwrapApiData<PaymentInitiateView>(body);
        const paymentId = data?.paymentId ?? data?.id;
        return {
          ...envelopeOk(status, body, 201),
          hasPaymentId: typeof paymentId === 'number',
          kindRedirect: data?.kind === 'redirect',
          hasRedirectUrl:
            typeof data?.redirectUrl === 'string' &&
            data.redirectUrl.includes('pay.stub.local'),
        };
      },
    },
  );
  markCovered('POST', '/payments/initiate');
  const paymentData = unwrapApiData<PaymentInitiateView>(initiated.body);
  const paymentId = paymentData?.paymentId ?? paymentData?.id;
  if (!paymentId) {
    throw new Error('Payment id missing');
  }

  await api(
    ++step.n,
    'payments.idempotency-replay',
    'POST',
    '/payments/initiate',
    {
      token,
      body: payBody,
      headers: { 'Idempotency-Key': payKey },
      expectStatus: 201,
      checks: (status, body) => {
        const data = unwrapApiData<PaymentInitiateView>(body);
        const replayId = data?.paymentId ?? data?.id;
        return {
          ...envelopeOk(status, body, 201),
          samePaymentId: replayId === paymentId,
        };
      },
    },
  );

  await api(
    ++step.n,
    'payments.idempotency-reuse-body',
    'POST',
    '/payments/initiate',
    {
      token,
      body: {
        ...payBody,
        method: 'CHEQUE',
      },
      headers: { 'Idempotency-Key': payKey },
      expectStatus: 409,
      checks: (status, body) =>
        errorOk(status, body, 409, 'IDEMPOTENCY_KEY_REUSED'),
    },
  );

  const paid = await api(
    ++step.n,
    'payments.mark-paid',
    'POST',
    `/payments/${paymentId}/mark-paid`,
    {
      token,
      checklistPath: '/payments/:id/mark-paid',
      checks: (status, body) => {
        const data = unwrapApiData<{
          orderId?: number;
          orderNumber?: string;
          status?: string;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasOrderId: typeof data?.orderId === 'number',
          hasOrderNumber: typeof data?.orderNumber === 'string',
          paid: data?.status === 'PAID',
        };
      },
    },
  );
  markCovered('POST', '/payments/:id/mark-paid');
  const orderId = unwrapApiData<{ orderId: number }>(paid.body)?.orderId;
  if (!orderId) {
    throw new Error('Order id missing after mark-paid');
  }

  // --- Orders ---
  await api(++step.n, 'orders.list', 'GET', '/orders', {
    token,
    checklistPath: '/orders',
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ id: number }>>(body);
      return {
        ...envelopeOk(status, body, 200),
        includesOrder:
          Array.isArray(data) && data.some((row) => row.id === orderId),
      };
    },
  });
  markCovered('GET', '/orders');

  await api(++step.n, 'orders.get', 'GET', `/orders/${orderId}`, {
    token,
    checklistPath: '/orders/:id',
    checks: (status, body) => {
      const data = unwrapApiData<{
        id?: number;
        status?: string;
        paymentStatus?: string;
        items?: unknown[];
        shippingMethod?: string;
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        sameId: data?.id === orderId,
        statusPaid: data?.status === 'PAID',
        paymentPaid: data?.paymentStatus === 'PAID',
        hasItems: Array.isArray(data?.items) && data.items.length > 0,
        shipping: data?.shippingMethod === 'EXPRESS_COURIER',
      };
    },
  });
  markCovered('GET', '/orders/:id');

  await api(++step.n, 'orders.not-found', 'GET', '/orders/99999999', {
    token,
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'ORDER_NOT_FOUND'),
  });

  await api(++step.n, 'cart.after-pay', 'GET', '/cart', {
    token,
    checks: (status, body) => {
      const data = unwrapApiData<CartView>(body);
      const invoice = data?.invoices?.find((row) => row.sellerId === sellerId);
      return {
        ...envelopeOk(status, body, 200),
        sellerCleared: !invoice || invoice.items.length === 0,
      };
    },
  });

  const path = saveReport();
  const failed = report.steps.filter((s) => !s.ok).length;
  const total = report.steps.length;
  const uncovered = report.endpointsChecklist.filter((e) => !e.covered);
  if (uncovered.length > 0) {
    console.log(
      `\nUncovered endpoints: ${uncovered
        .map((e) => `${e.method} ${e.path}`)
        .join(', ')}`,
    );
  }
  console.log(
    `\n${report.success ? 'PASS' : 'FAIL'} — ${total - failed}/${total} steps`,
  );
  console.log(`Report: ${path}`);
  if (!report.success || uncovered.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  try {
    saveReport();
  } catch {
    // ignore
  }
  process.exit(1);
});
