/**
 * Cheque payment verification API contract check.
 *
 * Verifies:
 *   - GET /payments/methods includes CHEQUE payee config
 *   - Initiate CHEQUE without bank validation → BANK_VALIDATION_REQUIRED
 *   - POST bank-account-validations + GET latest
 *   - Initiate CHEQUE → kind manual / PENDING
 *   - GET cheque-submission → AWAITING_DOCUMENTS before submit
 *   - Buyer mark-paid blocked for CHEQUE (PAYMENT_NOT_PAYABLE)
 *   - Upload photo → submit validation (invalid national id, plan mismatch)
 *   - Submit → AWAITING_REVIEW; admin list/reject/resubmit/approve
 *   - Approve materializes order; buyer forbidden on admin routes
 *
 * Requires migrations 0006_cheque_submissions + 0008_bank_account_validations.
 * Seeded product: pepsi-cola-6pk.
 *
 * Run:
 *   npm run cheque-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml up -d postgres redis api --wait
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm cheque-api-check
 *
 * Env: BASE_URL, OTP_DEV_CODE, ADMIN_PHONE
 */

import { randomBytes } from 'crypto';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { authLoginTokens, unwrapApiData } from './utils/unwrap-api-data';
import {
  createApiCheckHarness,
  sampleAddressBody,
  signupWholesaleBuyer,
} from './utils/api-check-harness';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_FILE =
  process.env.CHEQUE_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'cheque-api-check.json');
const RUN_ID = process.env.CHEQUE_API_CHECK_RUN_ID ?? Date.now().toString(36);
const OTP = process.env.OTP_DEV_CODE ?? '123456';
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '09000000001';
const PRODUCT_ID = 1;
const PRODUCT_SLUG = 'pepsi-cola-6pk';
/** Known-valid Iranian national ID (check digit). */
const VALID_NATIONAL_ID = '0013542419';

const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z',
  'base64',
);

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
  status: string;
  method?: string;
};

type ChequeSubmissionView = {
  paymentId: number;
  status: string;
  fullName: string | null;
  nationalId: string | null;
  rejectionReason: string | null;
  rejectionReasons?: string[];
  photos: Array<{ imageKey: string; url: string | null }>;
  planItems: Array<{ dueDate: string; amount: number }>;
  mailing?: { address?: string; postalCode?: string } | null;
  ui?: { outcome?: string; nextActions?: string[] };
  summary?: {
    payableAmount?: number;
    downPayment?: number;
    chequeTotal?: number;
    differenceAmount?: number;
  };
  order?: { orderId?: number; orderNumber?: string; status?: string } | null;
};

function jpegForm(): FormData {
  const form = new FormData();
  form.append(
    'file',
    new Blob([TINY_JPEG], { type: 'image/jpeg' }),
    `cheque-${RUN_ID}.jpg`,
  );
  return form;
}

function idempotencyKey(label: string): string {
  return `${label}_${RUN_ID}_${randomBytes(4).toString('hex')}`.slice(0, 100);
}

function futureIsoDate(daysAhead: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  console.log(`\ncheque-api-check → ${BASE_URL} (run ${RUN_ID})\n`);
  const step = { n: 0 };
  const { api, envelopeOk, errorOk, markCovered, finish } =
    createApiCheckHarness({
      name: 'cheque-api-check',
      baseUrl: BASE_URL,
      outputFile: OUTPUT_FILE,
      runId: RUN_ID,
      endpoints: [
        {
          method: 'GET',
          path: '/payments/methods',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/payments/bank-account-validations',
          auth: true,
          covered: false,
        },
        {
          method: 'GET',
          path: '/payments/bank-account-validations/latest',
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
        {
          method: 'POST',
          path: '/payments/:id/cheque-submission',
          auth: true,
          covered: false,
        },
        {
          method: 'GET',
          path: '/payments/:id/cheque-submission',
          auth: true,
          covered: false,
        },
        {
          method: 'GET',
          path: '/admin/payments/cheque-reviews',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/admin/payments/:id/cheque-approve',
          auth: true,
          covered: false,
        },
        {
          method: 'POST',
          path: '/admin/payments/:id/cheque-reject',
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

  const buyerToken = await signupWholesaleBuyer({
    api,
    step,
    otp: OTP,
    phoneSlot: 81,
    label: 'Cheque',
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
    token: buyerToken,
    body: sampleAddressBody({ label: 'آدرس چک' }),
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
    token: buyerToken,
    body: {
      sellerId,
      addressId,
      shippingMethod: 'EXPRESS_COURIER',
      deliveryDate,
      windowStartHour: window.startHour,
      windowEndHour: window.endHour,
      note: 'cheque-api-check',
    },
    expectStatus: 201,
    checks: (status, body) => {
      const data = unwrapApiData<CheckoutView>(body);
      return {
        ...envelopeOk(status, body, 201),
        hasId: typeof data?.id === 'number',
        payableInt: Number.isInteger(data?.summary?.payableAmount),
      };
    },
  });
  const checkout = unwrapApiData<CheckoutView>(checkoutRes.body);
  const checkoutSessionId = checkout?.id;
  const payableAmount = checkout?.summary?.payableAmount;
  if (!checkoutSessionId || typeof payableAmount !== 'number') {
    throw new Error('Checkout session / payable amount missing');
  }

  await api(++step.n, 'payments.methods', 'GET', '/payments/methods', {
    token: buyerToken,
    checklistPath: '/payments/methods',
      checks: (status, body) => {
        const data = unwrapApiData<
          Array<{
            name?: string;
            payee?: { name?: string; nationalId?: string };
            mailing?: { address?: string; postalCode?: string };
          }>
        >(body);
        const cheque = Array.isArray(data)
          ? data.find((row) => row.name === 'CHEQUE')
          : undefined;
        return {
          ...envelopeOk(status, body, 200),
          hasCheque: Boolean(cheque),
          hasPayeeName: typeof cheque?.payee?.name === 'string',
          hasPayeeNationalId: typeof cheque?.payee?.nationalId === 'string',
          hasMailingAddress: typeof cheque?.mailing?.address === 'string',
          hasMailingPostal: typeof cheque?.mailing?.postalCode === 'string',
        };
      },
  });
  markCovered('GET', '/payments/methods');

  const initiateBody = {
    checkoutSessionId,
    method: 'CHEQUE',
    callbackUrl: 'https://app.example/payments/callback',
  };

  await api(
    ++step.n,
    'payments.initiate-cheque-without-bank-validation',
    'POST',
    '/payments/initiate',
    {
      token: buyerToken,
      body: initiateBody,
      headers: { 'Idempotency-Key': idempotencyKey('cheque-no-bank') },
      expectStatus: 400,
      checklistPath: '/payments/initiate',
      checks: (status, body) =>
        errorOk(status, body, 400, 'BANK_VALIDATION_REQUIRED'),
    },
  );

  type BankValidationView = {
    id: number;
    creditGrade: string | null;
    creditCeiling: number | null;
    status: string;
    expiresAt: string | null;
  };

  const bankBody = {
    fullName: 'علی رضایی',
    accountNumber: '0123456789',
    nationalId: VALID_NATIONAL_ID,
    branchCode: '2574',
  };

  const validated = await api(
    ++step.n,
    'payments.bank-account-validate',
    'POST',
    '/payments/bank-account-validations',
    {
      token: buyerToken,
      body: bankBody,
      expectStatus: 201,
      checklistPath: '/payments/bank-account-validations',
      checks: (status, body) => {
        const data = unwrapApiData<BankValidationView>(body);
        return {
          ...envelopeOk(status, body, 201),
          hasId: typeof data?.id === 'number',
          succeeded: data?.status === 'SUCCEEDED',
          hasGrade: typeof data?.creditGrade === 'string',
          ceilingOk:
            typeof data?.creditCeiling === 'number' &&
            data.creditCeiling >= payableAmount,
          hasExpires: typeof data?.expiresAt === 'string',
        };
      },
    },
  );
  markCovered('POST', '/payments/bank-account-validations');
  const bankValidationId = unwrapApiData<BankValidationView>(validated.body)?.id;
  if (!bankValidationId) {
    throw new Error('Bank validation id missing');
  }

  await api(
    ++step.n,
    'payments.bank-account-latest',
    'GET',
    '/payments/bank-account-validations/latest',
    {
      token: buyerToken,
      checklistPath: '/payments/bank-account-validations/latest',
      checks: (status, body) => {
        const data = unwrapApiData<BankValidationView | null>(body);
        return {
          ...envelopeOk(status, body, 200),
          sameId: data?.id === bankValidationId,
          succeeded: data?.status === 'SUCCEEDED',
        };
      },
    },
  );
  markCovered('GET', '/payments/bank-account-validations/latest');

  const initiated = await api(
    ++step.n,
    'payments.initiate-cheque',
    'POST',
    '/payments/initiate',
    {
      token: buyerToken,
      body: initiateBody,
      headers: { 'Idempotency-Key': idempotencyKey('cheque') },
      expectStatus: 201,
      checklistPath: '/payments/initiate',
      checks: (status, body) => {
        const data = unwrapApiData<PaymentInitiateView>(body);
        const paymentId = data?.paymentId ?? data?.id;
        return {
          ...envelopeOk(status, body, 201),
          hasPaymentId: typeof paymentId === 'number',
          kindManual: data?.kind === 'manual',
          pending: data?.status === 'PENDING',
        };
      },
    },
  );
  markCovered('POST', '/payments/initiate');
  const paymentId =
    unwrapApiData<PaymentInitiateView>(initiated.body)?.paymentId ??
    unwrapApiData<PaymentInitiateView>(initiated.body)?.id;
  if (!paymentId) {
    throw new Error('Cheque payment id missing');
  }

  await api(
    ++step.n,
    'cheque.get-awaiting-documents',
    'GET',
    `/payments/${paymentId}/cheque-submission`,
    {
      token: buyerToken,
      checklistPath: '/payments/:id/cheque-submission',
      checks: (status, body) => {
        const data = unwrapApiData<ChequeSubmissionView>(body);
        return {
          ...envelopeOk(status, body, 200),
          awaitingDocs: data?.status === 'AWAITING_DOCUMENTS',
          samePayment: data?.paymentId === paymentId,
        };
      },
    },
  );
  markCovered('GET', '/payments/:id/cheque-submission');

  await api(
    ++step.n,
    'payments.mark-paid-blocked',
    'POST',
    `/payments/${paymentId}/mark-paid`,
    {
      token: buyerToken,
      expectStatus: 400,
      checklistPath: '/payments/:id/mark-paid',
      checks: (status, body) =>
        errorOk(status, body, 400, 'PAYMENT_NOT_PAYABLE'),
    },
  );
  markCovered('POST', '/payments/:id/mark-paid');

  const upload = await api(
    ++step.n,
    'files.upload-cheque-photo',
    'POST',
    '/files/upload',
    {
      token: buyerToken,
      formData: jpegForm(),
      checks: (status, body) => {
        const data = unwrapApiData<{ key?: string }>(body);
        return {
          ...envelopeOk(status, body, 200),
          keyUploads:
            typeof data?.key === 'string' && data.key.startsWith('uploads/'),
        };
      },
    },
  );
  const photoKey = unwrapApiData<{ key: string }>(upload.body)?.key;
  if (!photoKey) {
    throw new Error('Cheque photo upload key missing');
  }

  await api(
    ++step.n,
    'cheque.submit-invalid-national-id',
    'POST',
    `/payments/${paymentId}/cheque-submission`,
    {
      token: buyerToken,
      body: {
        fullName: 'علی رضایی',
        accountNumber: '0123456789',
        nationalId: '1234567890',
        branchCode: '2574',
        chequePhotos: [photoKey],
      },
      expectStatus: 400,
      checks: (status, body) =>
        errorOk(status, body, 400, 'INVALID_CHEQUE_FIELD'),
    },
  );

  await api(
    ++step.n,
    'cheque.submit-plan-mismatch',
    'POST',
    `/payments/${paymentId}/cheque-submission`,
    {
      token: buyerToken,
      body: {
        fullName: 'علی رضایی',
        accountNumber: '0123456789',
        nationalId: VALID_NATIONAL_ID,
        branchCode: '2574',
        chequePhotos: [photoKey],
        downPayment: 1,
        planItems: [
          { dueDate: futureIsoDate(30), amount: payableAmount },
        ],
      },
      expectStatus: 400,
      checks: (status, body) =>
        errorOk(status, body, 400, 'INVALID_CHEQUE_FIELD'),
    },
  );

  const submitted = await api(
    ++step.n,
    'cheque.submit',
    'POST',
    `/payments/${paymentId}/cheque-submission`,
    {
      token: buyerToken,
      body: {
        fullName: 'علی رضایی',
        accountNumber: '0123456789',
        nationalId: VALID_NATIONAL_ID,
        branchCode: '2574',
        chequePhotos: [photoKey],
        cadence: 'SINGLE',
        downPayment: 0,
        planItems: [
          { dueDate: futureIsoDate(30), amount: payableAmount },
        ],
      },
      checklistPath: '/payments/:id/cheque-submission',
      checks: (status, body) => {
        const data = unwrapApiData<ChequeSubmissionView>(body);
        return {
          ...envelopeOk(status, body, 200),
          awaitingReview: data?.status === 'AWAITING_REVIEW',
          physicalOutcome: data?.ui?.outcome === 'AWAITING_PHYSICAL',
          hasMailing: typeof data?.mailing?.address === 'string',
          nationalId: data?.nationalId === VALID_NATIONAL_ID,
          hasPhoto: data?.photos?.[0]?.imageKey === photoKey,
          planLen: data?.planItems?.length === 1,
          hasSummary: typeof data?.summary?.payableAmount === 'number',
        };
      },
    },
  );
  markCovered('POST', '/payments/:id/cheque-submission');
  if (!submitted.ok) {
    throw new Error('Cheque submit failed');
  }

  await api(
    ++step.n,
    'admin.forbidden-for-buyer',
    'GET',
    '/admin/payments/cheque-reviews',
    {
      token: buyerToken,
      expectStatus: 403,
      checks: (status, body) => errorOk(status, body, 403, 'FORBIDDEN'),
    },
  );

  await api(++step.n, 'admin.otp-request', 'POST', '/auth/otp/request', {
    body: { phone: ADMIN_PHONE },
    checks: (status, body) => envelopeOk(status, body, 200),
  });
  const adminVerify = await api(
    ++step.n,
    'admin.otp-verify',
    'POST',
    '/auth/otp/verify',
    {
      body: { phone: ADMIN_PHONE, code: OTP },
      checks: (status, body) => {
        const data = unwrapApiData<{
          accessToken?: string;
          user?: { roles?: string[] };
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          admin: data?.user?.roles?.includes('ADMIN') === true,
          hasToken: typeof data?.accessToken === 'string',
        };
      },
    },
  );
  const adminToken =
    authLoginTokens(adminVerify.body).accessToken ??
    unwrapApiData<{ accessToken?: string }>(adminVerify.body)?.accessToken;
  if (!adminToken) {
    throw new Error('Admin token missing — ensure ADMIN_PHONE is seeded');
  }

  await api(
    ++step.n,
    'admin.list-cheque-reviews',
    'GET',
    '/admin/payments/cheque-reviews?status=AWAITING_REVIEW',
    {
      token: adminToken,
      checklistPath: '/admin/payments/cheque-reviews',
      checks: (status, body) => {
        const data = unwrapApiData<
          Array<{ paymentId?: number; status?: string }>
        >(body);
        return {
          ...envelopeOk(status, body, 200),
          includesPayment:
            Array.isArray(data) &&
            data.some(
              (row) =>
                row.paymentId === paymentId &&
                row.status === 'AWAITING_REVIEW',
            ),
        };
      },
    },
  );
  markCovered('GET', '/admin/payments/cheque-reviews');

  await api(
    ++step.n,
    'admin.reject-cheque',
    'POST',
    `/admin/payments/${paymentId}/cheque-reject`,
    {
      token: adminToken,
      body: {
        reasons: ['IMAGE_QUALITY', 'SAYAD_MISMATCH'],
        note: 'Blurry cheque image',
      },
      checklistPath: '/admin/payments/:id/cheque-reject',
      checks: (status, body) => {
        const data = unwrapApiData<ChequeSubmissionView>(body);
        return {
          ...envelopeOk(status, body, 200),
          rejected: data?.status === 'REJECTED',
          failOutcome: data?.ui?.outcome === 'REJECTED',
          hasReasons:
            Array.isArray(data?.rejectionReasons) &&
            data.rejectionReasons.includes('IMAGE_QUALITY') &&
            data.rejectionReasons.includes('SAYAD_MISMATCH'),
          reuploadAction: data?.ui?.nextActions?.includes('REUPLOAD') === true,
          changeMethodAction:
            data?.ui?.nextActions?.includes('CHANGE_PAYMENT_METHOD') === true,
          reason: data?.rejectionReason === 'Blurry cheque image',
        };
      },
    },
  );
  markCovered('POST', '/admin/payments/:id/cheque-reject');

  const upload2 = await api(
    ++step.n,
    'files.upload-cheque-photo-resubmit',
    'POST',
    '/files/upload',
    {
      token: buyerToken,
      formData: jpegForm(),
      checks: (status, body) => {
        const data = unwrapApiData<{ key?: string }>(body);
        return {
          ...envelopeOk(status, body, 200),
          keyUploads:
            typeof data?.key === 'string' && data.key.startsWith('uploads/'),
        };
      },
    },
  );
  const photoKey2 = unwrapApiData<{ key: string }>(upload2.body)?.key;
  if (!photoKey2) {
    throw new Error('Resubmit photo key missing');
  }

  await api(
    ++step.n,
    'cheque.resubmit-after-reject',
    'POST',
    `/payments/${paymentId}/cheque-submission`,
    {
      token: buyerToken,
      body: {
        fullName: 'علی رضایی',
        accountNumber: '0123456789',
        nationalId: VALID_NATIONAL_ID,
        branchCode: '2574',
        chequePhotos: [photoKey2],
        cadence: 'SINGLE',
        downPayment: 0,
        planItems: [
          { dueDate: futureIsoDate(45), amount: payableAmount },
        ],
      },
      checks: (status, body) => {
        const data = unwrapApiData<ChequeSubmissionView>(body);
        return {
          ...envelopeOk(status, body, 200),
          awaitingReview: data?.status === 'AWAITING_REVIEW',
          clearedReason: data?.rejectionReason === null,
          newPhoto: data?.photos?.[0]?.imageKey === photoKey2,
        };
      },
    },
  );

  const approved = await api(
    ++step.n,
    'admin.approve-cheque',
    'POST',
    `/admin/payments/${paymentId}/cheque-approve`,
    {
      token: adminToken,
      checklistPath: '/admin/payments/:id/cheque-approve',
      checks: (status, body) => {
        const data = unwrapApiData<{
          status?: string;
          orderId?: number;
          orderNumber?: string;
          submission?: ChequeSubmissionView;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          paid: data?.status === 'PAID',
          hasOrderId: typeof data?.orderId === 'number',
          hasOrderNumber: typeof data?.orderNumber === 'string',
          submissionApproved: data?.submission?.status === 'APPROVED',
          successOutcome: data?.submission?.ui?.outcome === 'APPROVED',
          payPrepayment:
            data?.submission?.ui?.nextActions?.includes(
              'PAY_PREPAYMENT_ONLINE',
            ) === true,
          nextInvoice:
            data?.submission?.ui?.nextActions?.includes('NEXT_INVOICE') ===
            true,
          homeAction:
            data?.submission?.ui?.nextActions?.includes('HOME') === true,
          orderOnSubmission:
            data?.submission?.order?.orderId === data?.orderId,
        };
      },
    },
  );
  markCovered('POST', '/admin/payments/:id/cheque-approve');
  const orderId = unwrapApiData<{ orderId: number }>(approved.body)?.orderId;
  if (!orderId) {
    throw new Error('Order id missing after cheque approve');
  }

  await api(++step.n, 'orders.get-after-approve', 'GET', `/orders/${orderId}`, {
    token: buyerToken,
    checks: (status, body) => {
      const data = unwrapApiData<{
        id?: number;
        status?: string;
        paymentStatus?: string;
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        sameId: data?.id === orderId,
        statusPaid: data?.status === 'PAID',
        paymentPaid: data?.paymentStatus === 'PAID',
      };
    },
  });

  await api(
    ++step.n,
    'admin.reject-after-approve-fails',
    'POST',
    `/admin/payments/${paymentId}/cheque-reject`,
    {
      token: adminToken,
      body: {
        reasons: ['IMAGE_QUALITY'],
        note: 'Too late',
      },
      expectStatus: 400,
      checks: (status, body) =>
        errorOk(status, body, 400, 'CHEQUE_NOT_REVIEWABLE'),
    },
  );

  await api(
    ++step.n,
    'admin.approve-idempotent',
    'POST',
    `/admin/payments/${paymentId}/cheque-approve`,
    {
      token: adminToken,
      checks: (status, body) => {
        const data = unwrapApiData<{
          status?: string;
          orderId?: number;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          paid: data?.status === 'PAID',
          sameOrder: data?.orderId === orderId,
        };
      },
    },
  );

  finish();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
