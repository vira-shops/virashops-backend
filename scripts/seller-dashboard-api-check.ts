/**
 * Wholesale seller dashboard API contract check.
 *
 * Order: dashboard → orders (list/detail/status) → favorites → Q&A → profile → notifications.
 *
 * Setup: wholesale buyer checkout + mark-paid on pepsi-cola-6pk (seller 09000000999),
 * then catalog seller OTP login.
 *
 * Run:
 *   npm run seller-dashboard-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm seller-dashboard-api-check
 */

import { randomBytes } from 'crypto';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { unwrapApiData } from './utils/unwrap-api-data';
import {
  createApiCheckHarness,
  loginWithOtp,
  sampleAddressBody,
  signupWholesaleBuyer,
} from './utils/api-check-harness';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_FILE =
  process.env.SELLER_DASHBOARD_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'seller-dashboard-api-check.json');
const RUN_ID =
  process.env.SELLER_DASHBOARD_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const PRODUCT_ID = 1;
const PRODUCT_SLUG = 'pepsi-cola-6pk';
const CATALOG_SELLER_PHONE = '09000000999';

type QuoteView = {
  availableDates: string[];
  windows: Array<{ startHour: number; endHour: number }>;
};

type CheckoutView = {
  id: number;
  sellerId: number;
};

type SellerDashboardView = {
  counts: {
    paid: number;
    processing: number;
    preparing: number;
    shipped: number;
    delivered: number;
    returned: number;
    cancelled: number;
    failed: number;
  };
  unreadNotifications: number;
  bannerNotification: { id: number } | null;
  recentOrders: Array<{ id: number; orderNumber: string; status?: string }>;
};

type OrderListPage = {
  items: Array<{
    id: number;
    orderNumber: string;
    amount: number;
    status?: string;
    paymentStatus: string;
  }>;
  total: number;
};

type OrderDetailView = {
  id: number;
  status: string;
  paymentStatus: string;
  receiver?: { fullName?: string };
  items: unknown[];
};

type SellerProfileView = {
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  avatarKey: string | null;
  shopName: string | null;
  workplacePhone: string | null;
  postalCode: string | null;
  salesType: string | null;
  status: string;
  warehouses: Array<{
    id: number;
    phone: string | null;
    postalCode: string | null;
    city: string | null;
    address: string | null;
  }>;
};

async function main(): Promise<void> {
  console.log(`\nseller-dashboard-api-check → ${BASE_URL} (run ${RUN_ID})\n`);
  const step = { n: 0 };
  const { api, envelopeOk, errorOk, markCovered, finish } =
    createApiCheckHarness({
      name: 'seller-dashboard-api-check',
      baseUrl: BASE_URL,
      outputFile: OUTPUT_FILE,
      runId: RUN_ID,
      endpoints: [
        { method: 'GET', path: '/seller/dashboard', auth: true, covered: false },
        { method: 'GET', path: '/seller/orders', auth: true, covered: false },
        { method: 'GET', path: '/seller/orders/:id', auth: true, covered: false },
        {
          method: 'POST',
          path: '/seller/orders/:id/status',
          auth: true,
          covered: false,
        },
        { method: 'GET', path: '/favorites', auth: true, covered: false },
        {
          method: 'POST',
          path: '/favorites/:productId',
          auth: true,
          covered: false,
        },
        {
          method: 'DELETE',
          path: '/favorites/:productId',
          auth: true,
          covered: false,
        },
        {
          method: 'GET',
          path: '/seller/product-questions',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/seller/product-questions/:questionId/confirm',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/seller/product-questions/:questionId/answers',
          auth: true,
          covered: false,
        },
        { method: 'GET', path: '/seller/profile', auth: true, covered: false },
        { method: 'PATCH', path: '/seller/profile', auth: true, covered: false },
        { method: 'POST', path: '/seller/warehouses', auth: true, covered: false },
        {
          method: 'PATCH',
          path: '/seller/warehouses/:id',
          auth: true,
          covered: false,
        },
        {
          method: 'DELETE',
          path: '/seller/warehouses/:id',
          auth: true,
          covered: false,
        },
        { method: 'GET', path: '/notifications', auth: true, covered: false },
        {
          method: 'GET',
          path: '/notifications/unread-count',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/notifications/:id/read',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/notifications/read-all',
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

  await api(++step.n, 'seller.dashboard.unauthorized', 'GET', '/seller/dashboard', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  const buyerToken = await signupWholesaleBuyer({
    api,
    step,
    otp: OTP,
    phoneSlot: 81,
    label: 'SellerDash',
  });

  const product = await api(
    ++step.n,
    'setup.product',
    'GET',
    `/products/${PRODUCT_SLUG}?channel=WHOLESALE`,
    {
      checks: (status, body) => {
        const data = unwrapApiData<{ id?: number; seller?: { id?: number } }>(
          body,
        );
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
    token: buyerToken,
    body: sampleAddressBody({ label: 'آدرس فروشنده-داشبورد' }),
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
    token: buyerToken,
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
      token: buyerToken,
      body: { sellerId, addressId, method: 'EXPRESS_COURIER' },
      checks: (status, body) => {
        const data = unwrapApiData<QuoteView>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasDates: Array.isArray(data?.availableDates) && data.availableDates.length > 0,
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

  const checkoutRes = await api(++step.n, 'setup.checkout', 'POST', '/checkout', {
    token: buyerToken,
    body: {
      sellerId,
      addressId,
      shippingMethod: 'EXPRESS_COURIER',
      deliveryDate,
      windowStartHour: window.startHour,
      windowEndHour: window.endHour,
      note: 'seller-dashboard-api-check',
    },
    expectStatus: 201,
    checks: (status, body) => {
      const data = unwrapApiData<CheckoutView>(body);
      return {
        ...envelopeOk(status, body, 201),
        hasId: typeof data?.id === 'number',
      };
    },
  });
  const checkoutSessionId = unwrapApiData<CheckoutView>(checkoutRes.body)?.id;
  if (!checkoutSessionId) {
    throw new Error('Checkout session id missing');
  }

  const payKey = `sellpay_${RUN_ID}_${randomBytes(4).toString('hex')}`.slice(
    0,
    100,
  );
  const initiated = await api(
    ++step.n,
    'setup.payments.initiate',
    'POST',
    '/payments/initiate',
    {
      token: buyerToken,
      body: {
        checkoutSessionId,
        method: 'ONLINE',
        callbackUrl: 'https://app.example/payments/callback',
      },
      headers: { 'Idempotency-Key': payKey },
      expectStatus: 201,
      checks: (status, body) => {
        const data = unwrapApiData<{ paymentId?: number; id?: number }>(body);
        return {
          ...envelopeOk(status, body, 201),
          hasPaymentId: typeof (data?.paymentId ?? data?.id) === 'number',
        };
      },
    },
  );
  const paymentId =
    unwrapApiData<{ paymentId?: number; id?: number }>(initiated.body)
      ?.paymentId ??
    unwrapApiData<{ paymentId?: number; id?: number }>(initiated.body)?.id;
  if (!paymentId) {
    throw new Error('Payment id missing');
  }

  const paid = await api(
    ++step.n,
    'setup.payments.mark-paid',
    'POST',
    `/payments/${paymentId}/mark-paid`,
    {
      token: buyerToken,
      checks: (status, body) => {
        const data = unwrapApiData<{ orderId?: number }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasOrderId: typeof data?.orderId === 'number',
        };
      },
    },
  );
  const orderId = unwrapApiData<{ orderId: number }>(paid.body)?.orderId;
  if (!orderId) {
    throw new Error('Order id missing');
  }

  const asked = await api(
    ++step.n,
    'setup.qa.ask',
    'POST',
    `/products/${PRODUCT_ID}/questions`,
    {
      token: buyerToken,
      body: {
        body: `سوال فروشنده داشبورد (${RUN_ID})`,
        kind: 'QUESTION',
      },
      checks: (status, body) => {
        const data = unwrapApiData<{
          id?: number;
          kind?: string;
          status?: string;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasId: typeof data?.id === 'number',
          kindQuestion: data?.kind === 'QUESTION',
          notConfirmed: data?.status === 'NOT_CONFIRMED',
        };
      },
    },
  );
  const questionId = unwrapApiData<{ id: number }>(asked.body)?.id;
  if (!questionId) {
    throw new Error('Question id missing');
  }

  const sellerToken = await loginWithOtp({
    api,
    step,
    phone: CATALOG_SELLER_PHONE,
    otp: OTP,
    label: 'catalog-seller',
  });

  // --- 1. Dashboard ---
  const dash = await api(
    ++step.n,
    'seller.dashboard',
    'GET',
    '/seller/dashboard',
    {
      token: sellerToken,
      checklistPath: '/seller/dashboard',
      checks: (status, body) => {
        const data = unwrapApiData<SellerDashboardView>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasCounts:
            typeof data?.counts?.paid === 'number' &&
            typeof data?.counts?.preparing === 'number' &&
            typeof data?.counts?.delivered === 'number' &&
            typeof data?.counts?.returned === 'number',
          paidAtLeastOne: (data?.counts?.paid ?? 0) >= 1,
          recentIncludes:
            Array.isArray(data?.recentOrders) &&
            data.recentOrders.some((row) => row.id === orderId),
          unreadAtLeastOne: (data?.unreadNotifications ?? 0) >= 1,
        };
      },
    },
  );
  markCovered('GET', '/seller/dashboard');
  const bannerId = unwrapApiData<SellerDashboardView>(dash.body)
    ?.bannerNotification?.id;

  // --- 2. Orders ---
  await api(++step.n, 'seller.orders.list', 'GET', '/seller/orders', {
    token: sellerToken,
    checklistPath: '/seller/orders',
    checks: (status, body) => {
      const data = unwrapApiData<OrderListPage>(body);
      const row = data?.items?.find((item) => item.id === orderId);
      return {
        ...envelopeOk(status, body, 200),
        includesOrder: Boolean(row),
        statusPaid: row?.status === 'PAID',
      };
    },
  });
  markCovered('GET', '/seller/orders');

  await api(
    ++step.n,
    'seller.orders.get',
    'GET',
    `/seller/orders/${orderId}`,
    {
      token: sellerToken,
      checklistPath: '/seller/orders/:id',
      checks: (status, body) => {
        const data = unwrapApiData<OrderDetailView>(body);
        return {
          ...envelopeOk(status, body, 200),
          sameId: data?.id === orderId,
          statusPaid: data?.status === 'PAID',
          hasReceiver: Boolean(data?.receiver?.fullName),
        };
      },
    },
  );
  markCovered('GET', '/seller/orders/:id');

  await api(
    ++step.n,
    'seller.orders.status.preparing',
    'POST',
    `/seller/orders/${orderId}/status`,
    {
      token: sellerToken,
      body: { status: 'PREPARING' },
      checklistPath: '/seller/orders/:id/status',
      checks: (status, body) => {
        const data = unwrapApiData<OrderDetailView>(body);
        return {
          ...envelopeOk(status, body, 200),
          preparing: data?.status === 'PREPARING',
        };
      },
    },
  );
  markCovered('POST', '/seller/orders/:id/status');

  await api(
    ++step.n,
    'seller.orders.status.shipped',
    'POST',
    `/seller/orders/${orderId}/status`,
    {
      token: sellerToken,
      body: { status: 'SHIPPED' },
      checks: (status, body) => {
        const data = unwrapApiData<OrderDetailView>(body);
        return {
          ...envelopeOk(status, body, 200),
          shipped: data?.status === 'SHIPPED',
        };
      },
    },
  );

  await api(
    ++step.n,
    'seller.orders.status.returned',
    'POST',
    `/seller/orders/${orderId}/status`,
    {
      token: sellerToken,
      body: { status: 'RETURNED' },
      checks: (status, body) => {
        const data = unwrapApiData<OrderDetailView>(body);
        return {
          ...envelopeOk(status, body, 200),
          returned: data?.status === 'RETURNED',
        };
      },
    },
  );

  await api(
    ++step.n,
    'seller.orders.list.returned',
    'GET',
    '/seller/orders?status=RETURNED',
    {
      token: sellerToken,
      checks: (status, body) => {
        const data = unwrapApiData<OrderListPage>(body);
        const row = data?.items?.find((item) => item.id === orderId);
        return {
          ...envelopeOk(status, body, 200),
          includesReturned: row?.status === 'RETURNED',
        };
      },
    },
  );

  await api(
    ++step.n,
    'seller.orders.status.invalid',
    'POST',
    `/seller/orders/${orderId}/status`,
    {
      token: sellerToken,
      body: { status: 'PAID' },
      expectStatus: 400,
      checks: (status, body) =>
        errorOk(status, body, 400, 'INVALID_ORDER_STATUS_TRANSITION'),
    },
  );

  // --- 3. Favorites ---
  await api(
    ++step.n,
    'seller.favorites.add',
    'POST',
    `/favorites/${PRODUCT_ID}`,
    {
      token: sellerToken,
      checklistPath: '/favorites/:productId',
      checks: (status, body) => envelopeOk(status, body, 200),
    },
  );
  markCovered('POST', '/favorites/:productId');

  await api(++step.n, 'seller.favorites.list', 'GET', '/favorites', {
    token: sellerToken,
    checklistPath: '/favorites',
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ productId?: number }>>(body);
      return {
        ...envelopeOk(status, body, 200),
        includesProduct:
          Array.isArray(data) &&
          data.some((row) => row.productId === PRODUCT_ID),
      };
    },
  });
  markCovered('GET', '/favorites');

  await api(
    ++step.n,
    'seller.favorites.remove',
    'DELETE',
    `/favorites/${PRODUCT_ID}`,
    {
      token: sellerToken,
      checklistPath: '/favorites/:productId',
      checks: (status, body) => envelopeOk(status, body, 200),
    },
  );
  markCovered('DELETE', '/favorites/:productId');

  // --- 4. Q&A ---
  await api(
    ++step.n,
    'seller.qa.list',
    'GET',
    '/seller/product-questions?kind=QUESTION',
    {
      token: sellerToken,
      checklistPath: '/seller/product-questions',
      checks: (status, body) => {
        const data = unwrapApiData<
          Array<{
            id?: number;
            question?: string;
            kind?: string;
            status?: string;
            answers?: unknown[];
          }>
        >(body);
        const row = Array.isArray(data)
          ? data.find((item) => item.id === questionId)
          : undefined;
        return {
          ...envelopeOk(status, body, 200),
          includesQuestion: Boolean(row),
          hasComment: typeof row?.question === 'string',
          kindQuestion: row?.kind === 'QUESTION',
          notConfirmed: row?.status === 'NOT_CONFIRMED',
          hasAnswersArray: Array.isArray(row?.answers),
        };
      },
    },
  );
  markCovered('GET', '/seller/product-questions');

  await api(
    ++step.n,
    'seller.qa.confirm',
    'POST',
    `/seller/product-questions/${questionId}/confirm`,
    {
      token: sellerToken,
      checklistPath: '/seller/product-questions/:questionId/confirm',
      checks: (status, body) => {
        const data = unwrapApiData<{ id?: number; status?: string }>(body);
        return {
          ...envelopeOk(status, body, 200),
          idMatch: data?.id === questionId,
          confirmed: data?.status === 'CONFIRMED',
        };
      },
    },
  );
  markCovered('POST', '/seller/product-questions/:questionId/confirm');

  await api(
    ++step.n,
    'seller.qa.answer',
    'POST',
    `/seller/product-questions/${questionId}/answers`,
    {
      token: sellerToken,
      body: { body: `پاسخ فروشنده (${RUN_ID})` },
      checklistPath: '/seller/product-questions/:questionId/answers',
      checks: (status, body) => {
        const data = unwrapApiData<{ questionId?: number; body?: string }>(
          body,
        );
        return {
          ...envelopeOk(status, body, 200),
          questionId: data?.questionId === questionId,
          hasBody: typeof data?.body === 'string',
        };
      },
    },
  );
  markCovered('POST', '/seller/product-questions/:questionId/answers');

  // --- 5. Profile ---
  await api(++step.n, 'seller.profile.get', 'GET', '/seller/profile', {
    token: sellerToken,
    checklistPath: '/seller/profile',
    checks: (status, body) => {
      const data = unwrapApiData<SellerProfileView>(body);
      return {
        ...envelopeOk(status, body, 200),
        hasPhone: data?.phone === CATALOG_SELLER_PHONE,
        hasShop: typeof data?.shopName === 'string',
        hasWarehouses: Array.isArray(data?.warehouses),
        hasPersonalKeys:
          'nationalId' in (data ?? {}) &&
          'dateOfBirth' in (data ?? {}) &&
          'gender' in (data ?? {}) &&
          'avatarKey' in (data ?? {}),
        active: data?.status === 'ACTIVE',
      };
    },
  });
  markCovered('GET', '/seller/profile');

  await api(++step.n, 'seller.profile.patch', 'PATCH', '/seller/profile', {
    token: sellerToken,
    body: {
      workplacePhone: '02188887766',
      postalCode: '1234567890',
      nationalId: '0012345678',
      dateOfBirth: '1979-08-13',
      gender: 'MALE',
    },
    checklistPath: '/seller/profile',
    checks: (status, body) => {
      const data = unwrapApiData<SellerProfileView>(body);
      return {
        ...envelopeOk(status, body, 200),
        workplacePhone: data?.workplacePhone === '02188887766',
        postalCode: data?.postalCode === '1234567890',
        nationalId: data?.nationalId === '0012345678',
        dateOfBirth: data?.dateOfBirth === '1979-08-13',
        gender: data?.gender === 'MALE',
      };
    },
  });
  markCovered('PATCH', '/seller/profile');

  const warehouse = await api(
    ++step.n,
    'seller.warehouse.create',
    'POST',
    '/seller/warehouses',
    {
      token: sellerToken,
      body: {
        phone: '03512345678',
        postalCode: '8912345678',
        city: 'یزد',
        address: `انبار تست (${RUN_ID})`,
      },
      checklistPath: '/seller/warehouses',
      checks: (status, body) => {
        const data = unwrapApiData<{ id?: number; city?: string }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasId: typeof data?.id === 'number',
          city: data?.city === 'یزد',
        };
      },
    },
  );
  markCovered('POST', '/seller/warehouses');
  const warehouseId = unwrapApiData<{ id: number }>(warehouse.body)?.id;
  if (!warehouseId) {
    throw new Error('Warehouse id missing');
  }

  await api(
    ++step.n,
    'seller.warehouse.patch',
    'PATCH',
    `/seller/warehouses/${warehouseId}`,
    {
      token: sellerToken,
      body: { phone: '03587654321' },
      checklistPath: '/seller/warehouses/:id',
      checks: (status, body) => {
        const data = unwrapApiData<{ id?: number; phone?: string }>(body);
        return {
          ...envelopeOk(status, body, 200),
          idMatch: data?.id === warehouseId,
          phone: data?.phone === '03587654321',
        };
      },
    },
  );
  markCovered('PATCH', '/seller/warehouses/:id');

  await api(
    ++step.n,
    'seller.warehouse.delete',
    'DELETE',
    `/seller/warehouses/${warehouseId}`,
    {
      token: sellerToken,
      checklistPath: '/seller/warehouses/:id',
      checks: (status, body) => {
        const data = unwrapApiData<{ ok?: boolean }>(body);
        return {
          ...envelopeOk(status, body, 200),
          ok: data?.ok === true,
        };
      },
    },
  );
  markCovered('DELETE', '/seller/warehouses/:id');

  // --- 6. Notifications ---
  const notifList = await api(
    ++step.n,
    'seller.notifications.list',
    'GET',
    '/notifications?page=1&limit=20',
    {
      token: sellerToken,
      checklistPath: '/notifications',
      checks: (status, body) => {
        const data = unwrapApiData<{ items?: Array<{ id: number }>; total?: number }>(
          body,
        );
        return {
          ...envelopeOk(status, body, 200),
          hasItems: Array.isArray(data?.items) && data.items.length >= 1,
        };
      },
    },
  );
  markCovered('GET', '/notifications');
  const notifId =
    bannerId ??
    unwrapApiData<{ items: Array<{ id: number }> }>(notifList.body)?.items?.[0]
      ?.id;
  if (!notifId) {
    throw new Error('Seller notification id missing');
  }

  await api(
    ++step.n,
    'seller.notifications.unread',
    'GET',
    '/notifications/unread-count',
    {
      token: sellerToken,
      checklistPath: '/notifications/unread-count',
      checks: (status, body) => {
        const data = unwrapApiData<{ count?: number }>(body);
        return {
          ...envelopeOk(status, body, 200),
          countAtLeastOne: (data?.count ?? 0) >= 1,
        };
      },
    },
  );
  markCovered('GET', '/notifications/unread-count');

  await api(
    ++step.n,
    'seller.notifications.read',
    'POST',
    `/notifications/${notifId}/read`,
    {
      token: sellerToken,
      checklistPath: '/notifications/:id/read',
      checks: (status, body) => envelopeOk(status, body, 200),
    },
  );
  markCovered('POST', '/notifications/:id/read');

  await api(
    ++step.n,
    'seller.notifications.read-all',
    'POST',
    '/notifications/read-all',
    {
      token: sellerToken,
      checklistPath: '/notifications/read-all',
      checks: (status, body) => envelopeOk(status, body, 200),
    },
  );
  markCovered('POST', '/notifications/read-all');

  finish();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
