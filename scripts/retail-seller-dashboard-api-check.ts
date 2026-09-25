/**
 * Retail seller dashboard API contract check.
 *
 * Shared seller routes (dashboard, orders, favorites, Q&A, notifications)
 * plus a separate retail profile that must not change the wholesale profile.
 *
 * Run:
 *   npm run retail-seller-dashboard-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm retail-seller-dashboard-api-check
 */

import { join } from 'path';
import * as dotenv from 'dotenv';
import { unwrapApiData } from './utils/unwrap-api-data';
import { createApiCheckHarness, loginWithOtp } from './utils/api-check-harness';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_FILE =
  process.env.RETAIL_SELLER_DASHBOARD_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'retail-seller-dashboard-api-check.json');
const RUN_ID =
  process.env.RETAIL_SELLER_DASHBOARD_API_CHECK_RUN_ID ??
  Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const CATALOG_SELLER_PHONE = '09000000999';

type WholesaleProfile = {
  shopName: string | null;
  nationalId: string | null;
  workplacePhone: string | null;
};

type RetailProfile = {
  email: string | null;
  occupation: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string;
};

async function main(): Promise<void> {
  console.log(`\nretail-seller-dashboard-api-check → ${BASE_URL} (run ${RUN_ID})\n`);
  const step = { n: 0 };
  const { api, envelopeOk, errorOk, markCovered, finish } =
    createApiCheckHarness({
      name: 'retail-seller-dashboard-api-check',
      baseUrl: BASE_URL,
      outputFile: OUTPUT_FILE,
      runId: RUN_ID,
      endpoints: [
        { method: 'GET', path: '/seller/dashboard', auth: true, covered: false },
        { method: 'GET', path: '/seller/orders', auth: true, covered: false },
        { method: 'GET', path: '/favorites', auth: true, covered: false },
        {
          method: 'GET',
          path: '/seller/product-questions',
          auth: true,
          covered: false,
        },
        { method: 'GET', path: '/notifications', auth: true, covered: false },
        { method: 'GET', path: '/seller/profile', auth: true, covered: false },
        {
          method: 'GET',
          path: '/retail-seller/profile',
          auth: true,
          covered: false,
        },
        {
          method: 'PATCH',
          path: '/retail-seller/profile',
          auth: true,
          covered: false,
        },
      ],
    });

  await api(++step.n, 'health', 'GET', '/health', {
    checks: (status, body) => envelopeOk(status, body, 200),
  });

  await api(++step.n, 'seller.dashboard.unauthorized', 'GET', '/seller/dashboard', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  const sellerToken = await loginWithOtp({
    api,
    step,
    phone: CATALOG_SELLER_PHONE,
    otp: OTP,
    label: 'catalog-seller',
  });

  await api(++step.n, 'seller.dashboard', 'GET', '/seller/dashboard', {
    token: sellerToken,
    checklistPath: '/seller/dashboard',
    checks: (status, body) => {
      const data = unwrapApiData<{ counts?: { returned?: number } }>(body);
      return {
        ...envelopeOk(status, body, 200),
        hasCounts: typeof data?.counts?.returned === 'number',
      };
    },
  });
  markCovered('GET', '/seller/dashboard');

  await api(++step.n, 'seller.orders', 'GET', '/seller/orders', {
    token: sellerToken,
    checklistPath: '/seller/orders',
    checks: (status, body) => {
      const data = unwrapApiData<{ items?: unknown[]; total?: number }>(body);
      return {
        ...envelopeOk(status, body, 200),
        hasItems: Array.isArray(data?.items),
        hasTotal: typeof data?.total === 'number',
      };
    },
  });
  markCovered('GET', '/seller/orders');

  await api(++step.n, 'seller.favorites', 'GET', '/favorites', {
    token: sellerToken,
    checklistPath: '/favorites',
    checks: (status, body) => envelopeOk(status, body, 200),
  });
  markCovered('GET', '/favorites');

  await api(++step.n, 'seller.qa', 'GET', '/seller/product-questions', {
    token: sellerToken,
    checklistPath: '/seller/product-questions',
    checks: (status, body) => {
      const data = unwrapApiData<unknown[]>(body);
      return {
        ...envelopeOk(status, body, 200),
        isArray: Array.isArray(data),
      };
    },
  });
  markCovered('GET', '/seller/product-questions');

  await api(++step.n, 'seller.notifications', 'GET', '/notifications', {
    token: sellerToken,
    checklistPath: '/notifications',
    checks: (status, body) => envelopeOk(status, body, 200),
  });
  markCovered('GET', '/notifications');

  const before = await api(++step.n, 'wholesale.profile', 'GET', '/seller/profile', {
    token: sellerToken,
    checklistPath: '/seller/profile',
    checks: (status, body) => {
      const data = unwrapApiData<WholesaleProfile>(body);
      return {
        ...envelopeOk(status, body, 200),
        hasShop: typeof data?.shopName === 'string',
      };
    },
  });
  markCovered('GET', '/seller/profile');
  const wholesaleBefore = unwrapApiData<WholesaleProfile>(before.body);

  await api(++step.n, 'retail.profile.get', 'GET', '/retail-seller/profile', {
    token: sellerToken,
    checklistPath: '/retail-seller/profile',
    checks: (status, body) => {
      const data = unwrapApiData<RetailProfile>(body);
      return {
        ...envelopeOk(status, body, 200),
        phone: data?.phone === CATALOG_SELLER_PHONE,
        hasEmailKey: data !== null && 'email' in (data ?? {}),
      };
    },
  });
  markCovered('GET', '/retail-seller/profile');

  await api(++step.n, 'retail.profile.patch', 'PATCH', '/retail-seller/profile', {
    token: sellerToken,
    body: {
      email: `retail-${RUN_ID}@example.com`,
      occupation: 'فروشنده',
      province: 'یزد',
      city: 'یزد',
      latitude: 32,
      longitude: 54,
    },
    checklistPath: '/retail-seller/profile',
    checks: (status, body) => {
      const data = unwrapApiData<RetailProfile>(body);
      return {
        ...envelopeOk(status, body, 200),
        email: data?.email === `retail-${RUN_ID}@example.com`,
        occupation: data?.occupation === 'فروشنده',
        latitude: data?.latitude === 32,
        longitude: data?.longitude === 54,
      };
    },
  });
  markCovered('PATCH', '/retail-seller/profile');

  await api(++step.n, 'wholesale.profile.unchanged', 'GET', '/seller/profile', {
    token: sellerToken,
    checks: (status, body) => {
      const data = unwrapApiData<WholesaleProfile>(body);
      return {
        ...envelopeOk(status, body, 200),
        shopUnchanged: data?.shopName === wholesaleBefore?.shopName,
        nationalIdUnchanged: data?.nationalId === wholesaleBefore?.nationalId,
        phoneUnchanged: data?.workplacePhone === wholesaleBefore?.workplacePhone,
      };
    },
  });

  await finish();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
