/**
 * Carts / invoices API contract check.
 *
 * Covers: GET/DELETE /cart, POST/PATCH/DELETE /cart/items + qty/product/auth errors.
 * Seeded product: id 1 / pepsi-cola-6pk.
 *
 * Run:
 *   npm run carts-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm carts-api-check
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
  process.env.CARTS_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'carts-api-check.json');
const RUN_ID = process.env.CARTS_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const PRODUCT_ID = 1;
const PRODUCT_SLUG = 'pepsi-cola-6pk';

type CartItemView = {
  id: number;
  productId: number;
  packQty: number;
  pieceQty: number;
  commissionPercent: number;
  lineTotal: number;
  prepaymentAmount: number;
};

type CartView = {
  invoices: Array<{
    sellerId: number;
    items: CartItemView[];
    summary?: { grandTotal?: number };
  }>;
  summary?: { grandTotal?: number };
};

async function main(): Promise<void> {
  console.log(`\ncarts-api-check → ${BASE_URL} (run ${RUN_ID})\n`);
  const step = { n: 0 };
  const { api, envelopeOk, errorOk, markCovered, finish } =
    createApiCheckHarness({
      name: 'carts-api-check',
      baseUrl: BASE_URL,
      outputFile: OUTPUT_FILE,
      runId: RUN_ID,
      endpoints: [
        { method: 'GET', path: '/cart', auth: true, covered: false },
        { method: 'POST', path: '/cart/items', auth: true, covered: false },
        {
          method: 'PATCH',
          path: '/cart/items/:itemId',
          auth: true,
          covered: false,
        },
        {
          method: 'DELETE',
          path: '/cart/items/:itemId',
          auth: true,
          covered: false,
        },
        { method: 'DELETE', path: '/cart', auth: true, covered: false },
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
    phoneSlot: 41,
    label: 'Cart',
  });

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
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          productId: data?.id === PRODUCT_ID,
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

  await api(++step.n, 'cart.unauthorized', 'GET', '/cart', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  await api(++step.n, 'cart.clear', 'DELETE', '/cart', {
    token,
    checklistPath: '/cart',
    checks: (status, body) => {
      const data = unwrapApiData<CartView>(body);
      return {
        ...envelopeOk(status, body, 200),
        empty: Array.isArray(data?.invoices) && data.invoices.length === 0,
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
    throw new Error('Cart item id missing');
  }
  const lineTotal =
    cart?.invoices?.find((row) => row.sellerId === sellerId)?.items?.[0]
      ?.lineTotal ?? 0;

  await api(++step.n, 'cart.update-item', 'PATCH', `/cart/items/${itemId}`, {
    token,
    body: {
      packQty: 2,
      pieceQty: 0,
      prepaymentAmount: Math.min(
        lineTotal,
        Math.floor(lineTotal / 2) || lineTotal,
      ),
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
  });
  markCovered('PATCH', '/cart/items/:itemId');

  await api(++step.n, 'cart.get-invoices', 'GET', '/cart', {
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

  await api(
    ++step.n,
    'cart.update-missing',
    'PATCH',
    '/cart/items/99999999',
    {
      token,
      body: { packQty: 1, pieceQty: 0 },
      expectStatus: 404,
      checks: (status, body) =>
        errorOk(status, body, 404, 'CART_ITEM_NOT_FOUND'),
    },
  );

  cart = unwrapApiData<CartView>(
    (
      await api(++step.n, 'cart.get-before-remove', 'GET', '/cart', {
        token,
        checks: (status, body) => envelopeOk(status, body, 200),
      })
    ).body,
  );
  itemId = cart?.invoices
    ?.find((row) => row.sellerId === sellerId)
    ?.items?.[0]?.id;
  if (!itemId) {
    throw new Error('Cart item id missing before remove');
  }

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

  await api(++step.n, 'cart.re-add-after-remove', 'POST', '/cart/items', {
    token,
    body: { productId: PRODUCT_ID, packQty: 1, pieceQty: 0 },
    expectStatus: 201,
    checks: (status, body) => {
      const data = unwrapApiData<CartView>(body);
      const item = data?.invoices
        ?.find((row) => row.sellerId === sellerId)
        ?.items?.[0];
      return {
        ...envelopeOk(status, body, 201),
        revived: typeof item?.id === 'number',
      };
    },
  });

  await api(++step.n, 'cart.clear-final', 'DELETE', '/cart', {
    token,
    checks: (status, body) => {
      const data = unwrapApiData<CartView>(body);
      return {
        ...envelopeOk(status, body, 200),
        empty: Array.isArray(data?.invoices) && data.invoices.length === 0,
      };
    },
  });

  finish();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
