/**
 * Orders / checkout API contract check.
 *
 * Covers checkout start/get, payments initiate + mark-paid, orders list/get,
 * plus CART_EMPTY / ADDRESS_NOT_FOUND / ORDER_NOT_FOUND negatives.
 * Seeded product: id 1 / pepsi-cola-6pk.
 *
 * Run:
 *   npm run orders-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm orders-api-check
 */

import { randomBytes } from 'crypto';
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
  process.env.ORDERS_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'orders-api-check.json');
const RUN_ID = process.env.ORDERS_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const PRODUCT_ID = 1;
const PRODUCT_SLUG = 'pepsi-cola-6pk';

type CheckoutView = {
  id: number;
  sellerId: number;
  summary: {
    prepaymentTotal: number;
    shippingFee: number;
    payableAmount: number;
  };
};

type OrderView = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  items: unknown[];
};

type QuoteView = {
  method: string;
  amount: number;
  availableDates: string[];
  windows: Array<{ startHour: number; endHour: number }>;
};

async function main(): Promise<void> {
  console.log(`\norders-api-check → ${BASE_URL} (run ${RUN_ID})\n`);
  const step = { n: 0 };
  const { api, envelopeOk, errorOk, markCovered, finish } =
    createApiCheckHarness({
      name: 'orders-api-check',
      baseUrl: BASE_URL,
      outputFile: OUTPUT_FILE,
      runId: RUN_ID,
      endpoints: [
        { method: 'POST', path: '/checkout', auth: true, covered: false },
        { method: 'GET', path: '/checkout/:id', auth: true, covered: false },
        {
          method: 'GET',
          path: '/payments/methods',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/payments/initiate',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/payments/:id/mark-paid',
          auth: true,
          covered: false,
        },
        { method: 'GET', path: '/orders', auth: true, covered: false },
        { method: 'GET', path: '/orders/:id', auth: true, covered: false },
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
    phoneSlot: 61,
    label: 'Order',
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

  const address = await api(++step.n, 'setup.address', 'POST', '/addresses', {
    token,
    body: {
      label: 'آدرس سفارش',
      line1: 'خیابان ولیعصر',
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
  });
  const addressId = unwrapApiData<{ id: number }>(address.body)?.id;
  if (!addressId) {
    throw new Error('Address id missing');
  }

  await api(++step.n, 'setup.cart-add', 'POST', '/cart/items', {
    token,
    body: {
      productId: PRODUCT_ID,
      packQty: 1,
      pieceQty: 0,
      channel: 'WHOLESALE',
    },
    expectStatus: 201,
    checks: (status, body) => envelopeOk(status, body, 201),
  });

  const quoteRes = await api(
    ++step.n,
    'setup.shipping-quote',
    'POST',
    '/shipping/quote',
    {
      token,
      body: {
        sellerId,
        addressId,
        method: 'EXPRESS_COURIER',
      },
      checks: (status, body) => {
        const data = unwrapApiData<QuoteView>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasDates:
            Array.isArray(data?.availableDates) &&
            data.availableDates.length > 0,
          hasWindows:
            Array.isArray(data?.windows) && data.windows.length > 0,
        };
      },
    },
  );
  const quote = unwrapApiData<QuoteView>(quoteRes.body);
  const deliveryDate = quote?.availableDates?.[0];
  const window = quote?.windows?.[0];
  if (!deliveryDate || !window) {
    throw new Error('Quote dates/windows missing');
  }

  await api(++step.n, 'checkout.unauthorized', 'POST', '/checkout', {
    body: {
      sellerId,
      addressId,
      shippingMethod: 'EXPRESS_COURIER',
      deliveryDate,
      windowStartHour: window.startHour,
      windowEndHour: window.endHour,
    },
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

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

  await api(++step.n, 'checkout.empty-seller-cart', 'POST', '/checkout', {
    token,
    body: {
      sellerId: 99999999,
      addressId,
      shippingMethod: 'EXPRESS_COURIER',
      deliveryDate,
      windowStartHour: window.startHour,
      windowEndHour: window.endHour,
    },
    expectStatus: 400,
    checks: (status, body) => errorOk(status, body, 400, 'CART_EMPTY'),
  });

  const checkoutRes = await api(++step.n, 'checkout.start', 'POST', '/checkout', {
    token,
    body: {
      sellerId,
      addressId,
      shippingMethod: 'EXPRESS_COURIER',
      deliveryDate,
      windowStartHour: window.startHour,
      windowEndHour: window.endHour,
      note: 'orders-api-check',
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
  });
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

  await api(++step.n, 'payments.methods', 'GET', '/payments/methods', {
    token,
    checklistPath: '/payments/methods',
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ name?: string } | string>>(body);
      const names = Array.isArray(data)
        ? data.map((row) => (typeof row === 'string' ? row : row.name))
        : [];
      return {
        ...envelopeOk(status, body, 200),
        online: names.includes('ONLINE'),
        cheque: names.includes('CHEQUE'),
        payroll: names.includes('PAYROLL'),
        credit: names.includes('CREDIT_LC'),
      };
    },
  });
  markCovered('GET', '/payments/methods');

  const payKey = `ordpay_${RUN_ID}_${randomBytes(4).toString('hex')}`.slice(
    0,
    100,
  );
  const initiated = await api(
    ++step.n,
    'payments.initiate',
    'POST',
    '/payments/initiate',
    {
      token,
      body: {
        checkoutSessionId,
        method: 'ONLINE',
        callbackUrl: 'https://app.example/payments/callback',
      },
      headers: { 'Idempotency-Key': payKey },
      expectStatus: 201,
      checklistPath: '/payments/initiate',
      checks: (status, body) => {
        const data = unwrapApiData<{
          paymentId?: number;
          id?: number;
          kind?: string;
          redirectUrl?: string;
        }>(body);
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
  const paymentId =
    unwrapApiData<{ paymentId?: number; id?: number }>(initiated.body)
      ?.paymentId ??
    unwrapApiData<{ paymentId?: number; id?: number }>(initiated.body)?.id;
  if (!paymentId) {
    throw new Error('Payment id missing');
  }

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
    throw new Error('Order id missing');
  }

  await api(++step.n, 'orders.unauthorized', 'GET', '/orders', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  await api(++step.n, 'orders.list', 'GET', '/orders', {
    token,
    checklistPath: '/orders',
    checks: (status, body) => {
      const data = unwrapApiData<OrderView[]>(body);
      return {
        ...envelopeOk(status, body, 200),
        includesNew:
          Array.isArray(data) && data.some((row) => row.id === orderId),
      };
    },
  });
  markCovered('GET', '/orders');

  await api(++step.n, 'orders.get', 'GET', `/orders/${orderId}`, {
    token,
    checklistPath: '/orders/:id',
    checks: (status, body) => {
      const data = unwrapApiData<OrderView>(body);
      return {
        ...envelopeOk(status, body, 200),
        sameId: data?.id === orderId,
        paid: data?.paymentStatus === 'PAID',
        statusPaid: data?.status === 'PAID',
        hasItems: Array.isArray(data?.items) && data.items.length > 0,
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
      const data = unwrapApiData<{
        invoices?: Array<{ sellerId: number; items: unknown[] }>;
      }>(body);
      const invoice = data?.invoices?.find((row) => row.sellerId === sellerId);
      return {
        ...envelopeOk(status, body, 200),
        sellerCleared: !invoice || invoice.items.length === 0,
      };
    },
  });

  finish();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
