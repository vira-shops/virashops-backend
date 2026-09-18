/**
 * Addresses API contract check.
 *
 * Covers: GET/POST/PUT/DELETE /addresses + 401 / 404 ADDRESS_NOT_FOUND.
 *
 * Run:
 *   npm run addresses-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm addresses-api-check
 */

import { join } from 'path';
import * as dotenv from 'dotenv';
import { unwrapApiData } from './utils/unwrap-api-data';
import {
  createApiCheckHarness,
  signupWholesaleBuyer,
} from './utils/api-check-harness';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_FILE =
  process.env.ADDRESSES_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'addresses-api-check.json');
const RUN_ID =
  process.env.ADDRESSES_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';

type AddressView = {
  id: number;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
};

async function main(): Promise<void> {
  console.log(`\naddresses-api-check → ${BASE_URL} (run ${RUN_ID})\n`);
  const step = { n: 0 };
  const { api, envelopeOk, errorOk, markCovered, finish } =
    createApiCheckHarness({
      name: 'addresses-api-check',
      baseUrl: BASE_URL,
      outputFile: OUTPUT_FILE,
      runId: RUN_ID,
      endpoints: [
        { method: 'GET', path: '/addresses', auth: true, covered: false },
        { method: 'POST', path: '/addresses', auth: true, covered: false },
        { method: 'PUT', path: '/addresses/:id', auth: true, covered: false },
        { method: 'DELETE', path: '/addresses/:id', auth: true, covered: false },
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
    phoneSlot: 31,
    label: 'Address',
  });

  await api(++step.n, 'addresses.unauthorized', 'GET', '/addresses', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  const created = await api(++step.n, 'addresses.create', 'POST', '/addresses', {
    token,
    body: {
      label: 'انبار اصلی',
      line1: 'خیابان ولیعصر',
      line2: 'پلاک ۱۰',
      city: 'تهران',
      province: 'تهران',
      postalCode: '1234567890',
      isDefault: true,
    },
    expectStatus: 201,
    checklistPath: '/addresses',
    checks: (status, body) => {
      const data = unwrapApiData<AddressView>(body);
      return {
        ...envelopeOk(status, body, 201),
        hasId: typeof data?.id === 'number',
        label: data?.label === 'انبار اصلی',
        isDefault: data?.isDefault === true,
      };
    },
  });
  markCovered('POST', '/addresses');
  const addressId = unwrapApiData<AddressView>(created.body)?.id;
  if (!addressId) {
    throw new Error('Address id missing');
  }

  await api(++step.n, 'addresses.list', 'GET', '/addresses', {
    token,
    checklistPath: '/addresses',
    checks: (status, body) => {
      const data = unwrapApiData<AddressView[]>(body);
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
      label: 'انبار به‌روز',
      line1: 'خیابان انقلاب',
      line2: null,
      city: 'تهران',
      province: 'تهران',
      postalCode: '0987654321',
      isDefault: true,
    },
    checklistPath: '/addresses/:id',
    checks: (status, body) => {
      const data = unwrapApiData<AddressView>(body);
      return {
        ...envelopeOk(status, body, 200),
        label: data?.label === 'انبار به‌روز',
        line1: data?.line1 === 'خیابان انقلاب',
      };
    },
  });
  markCovered('PUT', '/addresses/:id');

  await api(++step.n, 'addresses.not-found', 'PUT', '/addresses/99999999', {
    token,
    body: {
      label: 'x',
      line1: 'y',
      city: 'تهران',
      province: 'تهران',
    },
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'ADDRESS_NOT_FOUND'),
  });

  const second = await api(
    ++step.n,
    'addresses.create-second',
    'POST',
    '/addresses',
    {
      token,
      body: {
        label: 'انبار دوم',
        line1: 'خیابان آزادی',
        city: 'تهران',
        province: 'تهران',
        isDefault: false,
      },
      expectStatus: 201,
      checks: (status, body) => {
        const data = unwrapApiData<AddressView>(body);
        return {
          ...envelopeOk(status, body, 201),
          hasId: typeof data?.id === 'number',
          notDefault: data?.isDefault === false,
        };
      },
    },
  );
  const secondId = unwrapApiData<AddressView>(second.body)?.id;
  if (!secondId) {
    throw new Error('Second address id missing');
  }

  await api(
    ++step.n,
    'addresses.delete',
    'DELETE',
    `/addresses/${secondId}`,
    {
      token,
      checklistPath: '/addresses/:id',
      checks: (status, body) => {
        const data = unwrapApiData<{ deleted?: boolean }>(body);
        return {
          ...envelopeOk(status, body, 200),
          deleted: data?.deleted === true,
        };
      },
    },
  );
  markCovered('DELETE', '/addresses/:id');

  await api(
    ++step.n,
    'addresses.delete-missing',
    'DELETE',
    '/addresses/99999999',
    {
      token,
      expectStatus: 404,
      checks: (status, body) => errorOk(status, body, 404, 'ADDRESS_NOT_FOUND'),
    },
  );

  await api(++step.n, 'addresses.list-after-delete', 'GET', '/addresses', {
    token,
    checks: (status, body) => {
      const data = unwrapApiData<AddressView[]>(body);
      return {
        ...envelopeOk(status, body, 200),
        stillHasFirst:
          Array.isArray(data) && data.some((row) => row.id === addressId),
        secondGone:
          Array.isArray(data) && !data.some((row) => row.id === secondId),
      };
    },
  });

  finish();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
