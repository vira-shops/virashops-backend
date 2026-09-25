/**
 * Customer dashboard API contract check.
 *
 * Order of coverage (matches dashboard UX):
 *   1. GET /dashboard (counts, banner, recent orders)
 *   2. Orders list (date filter) + detail
 *   3. Favorites add/list/remove
 *   4. Product Q&A (ask → seller answer → my questions/replies)
 *   5. Buyer profile GET/PATCH
 *   6. Notifications list / unread / read / read-all
 *
 * Setup: wholesale buyer signup → checkout → mark-paid (creates order + notif).
 * Seeded product: id 1 / pepsi-cola-6pk; catalog seller phone 09000000999.
 *
 * Run:
 *   npm run customer-dashboard-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm customer-dashboard-api-check
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
  process.env.CUSTOMER_DASHBOARD_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'customer-dashboard-api-check.json');
const RUN_ID =
  process.env.CUSTOMER_DASHBOARD_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const PRODUCT_ID = 1;
const PRODUCT_SLUG = 'pepsi-cola-6pk';
const CATALOG_SELLER_PHONE = '09000000999';
/** Known-valid Iranian national ID (check digit). */
const VALID_NATIONAL_ID = '0013542419';

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

type DashboardView = {
  counts: { delivered: number; processing: number; cancelled: number };
  unreadNotifications: number;
  bannerNotification: { id: number; unread?: boolean } | null;
  recentOrders: Array<{ id: number; orderNumber: string }>;
};

type OrderListPage = {
  items: Array<{
    id: number;
    orderNumber: string;
    amount: number;
    paymentStatus: string;
    createdAt: string | null;
    items: { imageKeys: string[]; extraCount: number; totalCount: number };
  }>;
  total: number;
};

type OrderDetailView = {
  id: number;
  orderNumber: string;
  paymentStatus: string;
  receiver?: { fullName?: string; phone?: string };
  items: unknown[];
};

type ProfileView = {
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string | null;
  gender: string | null;
  identityType: string | null;
  postalCode: string | null;
  businessName: string | null;
};

async function main(): Promise<void> {
  console.log(`\ncustomer-dashboard-api-check → ${BASE_URL} (run ${RUN_ID})\n`);
  const step = { n: 0 };
  const { api, envelopeOk, errorOk, markCovered, finish } =
    createApiCheckHarness({
      name: 'customer-dashboard-api-check',
      baseUrl: BASE_URL,
      outputFile: OUTPUT_FILE,
      runId: RUN_ID,
      endpoints: [
        { method: 'GET', path: '/dashboard', auth: true, covered: false },
        { method: 'GET', path: '/orders', auth: true, covered: false },
        { method: 'GET', path: '/orders/:id', auth: true, covered: false },
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
        { method: 'GET', path: '/me/questions', auth: true, covered: false },
        {
          method: 'GET',
          path: '/me/question-replies',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/products/:productId/questions',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/seller/product-questions/:questionId/answers',
          auth: true,
          covered: false,
        },
        { method: 'GET', path: '/profile', auth: true, covered: false },
        { method: 'PATCH', path: '/profile', auth: true, covered: false },
        { method: 'GET', path: '/notifications', auth: true, covered: false },
        {
          method: 'GET',
          path: '/notifications/unread-count',
          auth: true,
          covered: false,
        },
        {
          method: 'GET',
          path: '/notifications/:id',
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

  await api(++step.n, 'dashboard.unauthorized', 'GET', '/dashboard', {
    expectStatus: 401,
    checks: (status, body) => errorOk(status, body, 401, 'UNAUTHORIZED'),
  });

  const token = await signupWholesaleBuyer({
    api,
    step,
    otp: OTP,
    phoneSlot: 71,
    label: 'Dash',
  });

  const product = await api(
    ++step.n,
    'setup.product',
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
    body: sampleAddressBody({ label: 'آدرس داشبورد' }),
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
          hasWindows: Array.isArray(data?.windows) && data.windows.length > 0,
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
    token,
    body: {
      sellerId,
      addressId,
      shippingMethod: 'EXPRESS_COURIER',
      deliveryDate,
      windowStartHour: window.startHour,
      windowEndHour: window.endHour,
      note: 'customer-dashboard-api-check',
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

  const payKey = `dashpay_${RUN_ID}_${randomBytes(4).toString('hex')}`.slice(
    0,
    100,
  );
  const initiated = await api(
    ++step.n,
    'setup.payments.initiate',
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
      checks: (status, body) => {
        const data = unwrapApiData<{ paymentId?: number; id?: number }>(body);
        const paymentId = data?.paymentId ?? data?.id;
        return {
          ...envelopeOk(status, body, 201),
          hasPaymentId: typeof paymentId === 'number',
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
      token,
      expectStatus: 200,
      checks: (status, body) => {
        const data = unwrapApiData<{ orderId?: number; order?: { id?: number } }>(
          body,
        );
        const orderId = data?.orderId ?? data?.order?.id;
        return {
          ...envelopeOk(status, body, 200),
          hasOrderId: typeof orderId === 'number',
        };
      },
    },
  );
  const orderId =
    unwrapApiData<{ orderId?: number; order?: { id?: number } }>(paid.body)
      ?.orderId ??
    unwrapApiData<{ orderId?: number; order?: { id?: number } }>(paid.body)
      ?.order?.id;
  if (!orderId) {
    throw new Error('Order id missing after mark-paid');
  }

  // --- 1. Dashboard ---
  const dashboardRes = await api(
    ++step.n,
    'dashboard.home',
    'GET',
    '/dashboard',
    {
      token,
      checklistPath: '/dashboard',
      checks: (status, body) => {
        const data = unwrapApiData<DashboardView>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasCounts:
            typeof data?.counts?.delivered === 'number' &&
            typeof data?.counts?.processing === 'number' &&
            typeof data?.counts?.cancelled === 'number',
          processingOrRecent:
            (data?.counts?.processing ?? 0) >= 1 ||
            (Array.isArray(data?.recentOrders) &&
              data.recentOrders.some((row) => row.id === orderId)),
          unreadAtLeastOne: (data?.unreadNotifications ?? 0) >= 1,
          hasBanner: data?.bannerNotification != null,
          recentIncludesOrder:
            Array.isArray(data?.recentOrders) &&
            data.recentOrders.some((row) => row.id === orderId),
        };
      },
    },
  );
  markCovered('GET', '/dashboard');
  const dashboard = unwrapApiData<DashboardView>(dashboardRes.body);
  const bannerId = dashboard?.bannerNotification?.id;

  // --- 2. Orders ---
  const today = new Date().toISOString().slice(0, 10);
  await api(
    ++step.n,
    'orders.list',
    'GET',
    `/orders?fromDate=${today}&toDate=${today}&page=1&limit=20`,
    {
      token,
      checklistPath: '/orders',
      checks: (status, body) => {
        const data = unwrapApiData<OrderListPage>(body);
        const row = data?.items?.find((item) => item.id === orderId);
        return {
          ...envelopeOk(status, body, 200),
          includesNew: Boolean(row),
          listShape:
            typeof row?.orderNumber === 'string' &&
            typeof row?.amount === 'number' &&
            typeof row?.paymentStatus === 'string' &&
            typeof row?.items?.totalCount === 'number',
          totalAtLeastOne: (data?.total ?? 0) >= 1,
        };
      },
    },
  );
  markCovered('GET', '/orders');

  await api(++step.n, 'orders.get', 'GET', `/orders/${orderId}`, {
    token,
    checklistPath: '/orders/:id',
    checks: (status, body) => {
      const data = unwrapApiData<OrderDetailView>(body);
      return {
        ...envelopeOk(status, body, 200),
        sameId: data?.id === orderId,
        paid: data?.paymentStatus === 'PAID',
        hasItems: Array.isArray(data?.items) && data.items.length > 0,
        hasReceiver: Boolean(data?.receiver?.fullName),
      };
    },
  });
  markCovered('GET', '/orders/:id');

  await api(++step.n, 'orders.not-found', 'GET', '/orders/99999999', {
    token,
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'ORDER_NOT_FOUND'),
  });

  // --- 3. Favorites ---
  await api(
    ++step.n,
    'favorites.add',
    'POST',
    `/favorites/${PRODUCT_ID}`,
    {
      token,
      checklistPath: '/favorites/:productId',
      checks: (status, body) => {
        const data = unwrapApiData<{ id?: number; productId?: number }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasId: typeof data?.id === 'number',
          productId: data?.productId === PRODUCT_ID,
        };
      },
    },
  );
  markCovered('POST', '/favorites/:productId');

  await api(
    ++step.n,
    'favorites.add-idempotent',
    'POST',
    `/favorites/${PRODUCT_ID}`,
    {
      token,
      checks: (status, body) => {
        const data = unwrapApiData<{ productId?: number }>(body);
        return {
          ...envelopeOk(status, body, 200),
          productId: data?.productId === PRODUCT_ID,
        };
      },
    },
  );

  await api(++step.n, 'favorites.list', 'GET', '/favorites', {
    token,
    checklistPath: '/favorites',
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ id?: number; productId?: number }>>(
        body,
      );
      return {
        ...envelopeOk(status, body, 200),
        includesProduct:
          Array.isArray(data) &&
          data.some(
            (row) => row.productId === PRODUCT_ID || row.id === PRODUCT_ID,
          ),
      };
    },
  });
  markCovered('GET', '/favorites');

  await api(
    ++step.n,
    'favorites.remove',
    'DELETE',
    `/favorites/${PRODUCT_ID}`,
    {
      token,
      checklistPath: '/favorites/:productId',
      checks: (status, body) => {
        const data = unwrapApiData<{ removed?: boolean }>(body);
        return {
          ...envelopeOk(status, body, 200),
          removed: data?.removed === true,
        };
      },
    },
  );
  markCovered('DELETE', '/favorites/:productId');

  await api(++step.n, 'favorites.list-empty', 'GET', '/favorites', {
    token,
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ productId?: number; id?: number }>>(
        body,
      );
      return {
        ...envelopeOk(status, body, 200),
        withoutProduct:
          Array.isArray(data) &&
          !data.some(
            (row) => row.productId === PRODUCT_ID || row.id === PRODUCT_ID,
          ),
      };
    },
  });

  // Re-add so dashboard favorites path stays usable after Q&A
  await api(
    ++step.n,
    'favorites.re-add',
    'POST',
    `/favorites/${PRODUCT_ID}`,
    {
      token,
      checks: (status, body) => envelopeOk(status, body, 200),
    },
  );

  // --- 4. Product Q&A ---
  const asked = await api(
    ++step.n,
    'qa.ask',
    'POST',
    `/products/${PRODUCT_ID}/questions`,
    {
      token,
      body: { body: `آیا این محصول موجود است؟ (${RUN_ID})` },
      checklistPath: '/products/:productId/questions',
      checks: (status, body) => {
        const data = unwrapApiData<{
          id?: number;
          productId?: number;
          body?: string;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasId: typeof data?.id === 'number',
          productId: data?.productId === PRODUCT_ID,
          hasBody: typeof data?.body === 'string' && data.body.length >= 2,
        };
      },
    },
  );
  markCovered('POST', '/products/:productId/questions');
  const questionId = unwrapApiData<{ id: number }>(asked.body)?.id;
  if (!questionId) {
    throw new Error('Question id missing');
  }

  await api(++step.n, 'qa.my-questions', 'GET', '/me/questions', {
    token,
    checklistPath: '/me/questions',
    checks: (status, body) => {
      const data = unwrapApiData<Array<{ id?: number; questionId?: number }>>(
        body,
      );
      return {
        ...envelopeOk(status, body, 200),
        includesQuestion:
          Array.isArray(data) &&
          data.some(
            (row) => row.id === questionId || row.questionId === questionId,
          ),
      };
    },
  });
  markCovered('GET', '/me/questions');

  await api(++step.n, 'qa.my-replies-empty', 'GET', '/me/question-replies', {
    token,
    checklistPath: '/me/question-replies',
    checks: (status, body) => {
      const data = unwrapApiData<{
        items?: unknown[];
        newRepliesCount?: number;
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        hasItems: Array.isArray(data?.items),
        newRepliesCount: typeof data?.newRepliesCount === 'number',
      };
    },
  });
  markCovered('GET', '/me/question-replies');

  const sellerToken = await loginWithOtp({
    api,
    step,
    phone: CATALOG_SELLER_PHONE,
    otp: OTP,
    label: 'catalog-seller',
  });

  await api(
    ++step.n,
    'qa.seller-answer',
    'POST',
    `/seller/product-questions/${questionId}/answers`,
    {
      token: sellerToken,
      body: { body: `بله، موجود است (${RUN_ID})` },
      checklistPath: '/seller/product-questions/:questionId/answers',
      checks: (status, body) => {
        const data = unwrapApiData<{
          id?: number;
          questionId?: number;
          body?: string;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasId: typeof data?.id === 'number',
          questionId: data?.questionId === questionId,
          hasBody: typeof data?.body === 'string',
        };
      },
    },
  );
  markCovered('POST', '/seller/product-questions/:questionId/answers');

  await api(++step.n, 'qa.my-replies', 'GET', '/me/question-replies', {
    token,
    checks: (status, body) => {
      const data = unwrapApiData<{
        items?: Array<{ id?: number; questionId?: number }>;
        newRepliesCount?: number;
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        includesAnswered:
          Array.isArray(data?.items) &&
          data.items.some(
            (row) => row.id === questionId || row.questionId === questionId,
          ),
        newRepliesAtLeastOne: (data?.newRepliesCount ?? 0) >= 1,
      };
    },
  });

  // --- 5. Profile ---
  await api(++step.n, 'profile.get', 'GET', '/profile', {
    token,
    checklistPath: '/profile',
    checks: (status, body) => {
      const data = unwrapApiData<ProfileView>(body);
      return {
        ...envelopeOk(status, body, 200),
        hasName: typeof data?.firstName === 'string',
        hasPhone: typeof data?.phone === 'string' && data.phone.startsWith('09'),
      };
    },
  });
  markCovered('GET', '/profile');

  await api(++step.n, 'profile.patch', 'PATCH', '/profile', {
    token,
    body: {
      firstName: 'حسین',
      lastName: 'حیدری',
      nationalId: VALID_NATIONAL_ID,
      dateOfBirth: '1990-05-15',
      gender: 'MALE',
      businessName: 'دکه تست',
      businessPhone: '09121112233',
      postalCode: '1234567890',
      province: 'یزد',
      city: 'یزد',
      address: 'خیابان ۱۷ شهریور',
      identityType: 'KIOSK',
    },
    checklistPath: '/profile',
    checks: (status, body) => {
      const data = unwrapApiData<ProfileView>(body);
      return {
        ...envelopeOk(status, body, 200),
        firstName: data?.firstName === 'حسین',
        nationalId: data?.nationalId === VALID_NATIONAL_ID,
        gender: data?.gender === 'MALE',
        identityType: data?.identityType === 'KIOSK',
        postalCode: data?.postalCode === '1234567890',
        businessName: data?.businessName === 'دکه تست',
      };
    },
  });
  markCovered('PATCH', '/profile');

  await api(++step.n, 'profile.get-after', 'GET', '/profile', {
    token,
    checks: (status, body) => {
      const data = unwrapApiData<ProfileView>(body);
      return {
        ...envelopeOk(status, body, 200),
        identityType: data?.identityType === 'KIOSK',
        nationalId: data?.nationalId === VALID_NATIONAL_ID,
      };
    },
  });

  // --- 6. Notifications ---
  const notifList = await api(
    ++step.n,
    'notifications.list',
    'GET',
    '/notifications?page=1&limit=20',
    {
      token,
      checklistPath: '/notifications',
      checks: (status, body) => {
        const data = unwrapApiData<{
          items?: Array<{ id: number; unread?: boolean }>;
          total?: number;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasItems: Array.isArray(data?.items) && data.items.length >= 1,
          totalAtLeastOne: (data?.total ?? 0) >= 1,
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
    throw new Error('Notification id missing');
  }

  await api(
    ++step.n,
    'notifications.unread-count',
    'GET',
    '/notifications/unread-count',
    {
      token,
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
    'notifications.get',
    'GET',
    `/notifications/${notifId}`,
    {
      token,
      checklistPath: '/notifications/:id',
      checks: (status, body) => {
        const data = unwrapApiData<{ id?: number; title?: string }>(body);
        return {
          ...envelopeOk(status, body, 200),
          sameId: data?.id === notifId,
          hasTitle: typeof data?.title === 'string',
        };
      },
    },
  );
  markCovered('GET', '/notifications/:id');

  await api(
    ++step.n,
    'notifications.read-one',
    'POST',
    `/notifications/${notifId}/read`,
    {
      token,
      checklistPath: '/notifications/:id/read',
      checks: (status, body) => {
        const data = unwrapApiData<{ id?: number; unread?: boolean; readAt?: string | null }>(
          body,
        );
        return {
          ...envelopeOk(status, body, 200),
          sameId: data?.id === notifId,
          markedRead: data?.unread === false || data?.readAt != null,
        };
      },
    },
  );
  markCovered('POST', '/notifications/:id/read');

  await api(
    ++step.n,
    'notifications.read-all',
    'POST',
    '/notifications/read-all',
    {
      token,
      checklistPath: '/notifications/read-all',
      checks: (status, body) => {
        const data = unwrapApiData<{ updated?: number; count?: number }>(body);
        return {
          ...envelopeOk(status, body, 200),
          hasResult:
            typeof data?.updated === 'number' ||
            typeof data?.count === 'number' ||
            data != null,
        };
      },
    },
  );
  markCovered('POST', '/notifications/read-all');

  await api(
    ++step.n,
    'notifications.unread-after',
    'GET',
    '/notifications/unread-count',
    {
      token,
      checks: (status, body) => {
        const data = unwrapApiData<{ count?: number }>(body);
        return {
          ...envelopeOk(status, body, 200),
          zeroUnread: data?.count === 0,
        };
      },
    },
  );

  await api(
    ++step.n,
    'notifications.not-found',
    'GET',
    '/notifications/99999999',
    {
      token,
      expectStatus: 404,
      checks: (status, body) =>
        errorOk(status, body, 404, 'NOTIFICATION_NOT_FOUND'),
    },
  );

  // Final dashboard sanity after reads
  await api(++step.n, 'dashboard.after-reads', 'GET', '/dashboard', {
    token,
    checks: (status, body) => {
      const data = unwrapApiData<DashboardView>(body);
      return {
        ...envelopeOk(status, body, 200),
        unreadZero: data?.unreadNotifications === 0,
        recentStillThere:
          Array.isArray(data?.recentOrders) &&
          data.recentOrders.some((row) => row.id === orderId),
      };
    },
  });

  finish();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
