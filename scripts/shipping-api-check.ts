/**
 * Shipping API contract check.
 *
 * Covers: GET /shipping/methods, POST /shipping/quote (+ bad method / missing address).
 * Needs a buyer address and seeded product seller.
 *
 * Run:
 *   npm run shipping-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm shipping-api-check
 */

import { join } from 'path';
import * as dotenv from 'dotenv';
import { unwrapApiData, unwrapError, envelopeStatus } from './utils/unwrap-api-data';
import {
  createApiCheckHarness,
  sampleAddressBody,
  signupWholesaleBuyer,
} from './utils/api-check-harness';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_FILE =
  process.env.SHIPPING_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'shipping-api-check.json');
const RUN_ID =
  process.env.SHIPPING_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const PRODUCT_SLUG = 'pepsi-cola-6pk';

type QuoteView = {
  method: string;
  amount: number;
  availableDates: string[];
  windows: Array<{ startHour: number; endHour: number }>;
};

async function main(): Promise<void> {
  console.log(`\nshipping-api-check → ${BASE_URL} (run ${RUN_ID})\n`);
  const step = { n: 0 };
  const { api, envelopeOk, errorOk, markCovered, finish } =
    createApiCheckHarness({
      name: 'shipping-api-check',
      baseUrl: BASE_URL,
      outputFile: OUTPUT_FILE,
      runId: RUN_ID,
      endpoints: [
        {
          method: 'GET',
          path: '/shipping/methods',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/shipping/quote',
          auth: true,
          covered: false,
        },
      ],
    });

  await api(++step.n, 'health', 'GET', '/health', {
    checks: (status, body) => {
      const data = unwrapApiData<{ status?: string }>(body);
      return {
        ...envelopeOk(status, body, 200),
        healthy: data?.status === 'ok',
      };
    },
  });

  const token = await signupWholesaleBuyer({
    api,
    step,
    otp: OTP,
    phoneSlot: 51,
    label: 'Ship',
  });

  const product = await api(
    ++step.n,
    'catalog.product',
    'GET',
    `/products/${PRODUCT_SLUG}?channel=WHOLESALE`,
    {
      checks: (status, body) => {
        const data = unwrapApiData<{ seller?: { id?: number } }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasSeller: typeof data?.seller?.id === 'number',
        };
      },
    },
  );
  const sellerId = unwrapApiData<{ seller: { id: number } }>(product.body)
    ?.seller?.id;
  if (!sellerId) {
    throw new Error('Product seller id missing');
  }

  const address = await api(++step.n, 'setup.address', 'POST', '/addresses', {
    token,
    body: sampleAddressBody({ label: 'آدرس ارسال' }),
    expectStatus: 201,
    checks: (status, body) => {
      const data = unwrapApiData<{ id?: number }>(body);
      return {
        ...envelopeOk(status, body, 201),
        hasId: typeof data?.id === 'number',
      };
    },
  });
  const addressId = unwrapApiData<{ id: number }>(address.body)?.id;
  if (!addressId) {
    throw new Error('Address id missing');
  }

  await api(++step.n, 'setup.cart-add', 'POST', '/cart/items', {
    token,
    body: {
      productId: 1,
      packQty: 1,
      pieceQty: 0,
      channel: 'WHOLESALE',
    },
    expectStatus: 201,
    checks: (status, body) => envelopeOk(status, body, 201),
  });

  await api(++step.n, 'shipping.unauthorized', 'GET', '/shipping/methods', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  await api(++step.n, 'shipping.methods', 'GET', '/shipping/methods', {
    token,
    checklistPath: '/shipping/methods',
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ name?: string }>>(body);
      const names = Array.isArray(data) ? data.map((row) => row.name) : [];
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
      addressId,
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

  await api(++step.n, 'shipping.bad-address', 'POST', '/shipping/quote', {
    token,
    body: {
      sellerId,
      addressId: 99999999,
      method: 'EXPRESS_COURIER',
    },
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'ADDRESS_NOT_FOUND'),
  });

  const quote = await api(
    ++step.n,
    'shipping.quote-express',
    'POST',
    '/shipping/quote',
    {
      token,
      body: {
        sellerId,
        addressId,
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

  const express = unwrapApiData<QuoteView>(quote.body);
  if (!express?.availableDates?.[0] || !express.windows?.[0]) {
    throw new Error('Express quote missing dates/windows');
  }

  await api(++step.n, 'shipping.quote-post', 'POST', '/shipping/quote', {
    token,
    body: {
      sellerId,
      addressId,
      method: 'IRAN_POST',
    },
    checks: (status, body) => {
      const data = unwrapApiData<QuoteView>(body);
      return {
        ...envelopeOk(status, body, 200),
        method: data?.method === 'IRAN_POST',
        amountInt: Number.isInteger(data?.amount),
      };
    },
  });

  finish();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
