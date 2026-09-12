/**
 * Catalog API contract check (categories + products + search).
 *
 * Verifies:
 *   - GET /health envelope
 *   - Categories: tree, home, by slug, 404 CATEGORY_NOT_FOUND, fa/en names, productCount
 *   - Products: list (pagination, categorySlug, channel, sort), detail + related + wholesale,
 *     404 PRODUCT_NOT_FOUND for missing/draft
 *   - Search: suggestions (category + product terms), catalog hits with filters,
 *     empty query empty-state
 *   - Cross-wiring: category productCount matches list totals; search cards match list shape
 *
 * Run:
 *   npm run catalog-api-check
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml up -d postgres redis api --wait
 *   docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm catalog-api-check
 *
 * Env: BASE_URL
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import {
  envelopeStatus,
  isObject,
  unwrapApiData,
  unwrapError,
} from './utils/unwrap-api-data';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_FILE =
  process.env.CATALOG_API_CHECK_OUTPUT ??
  join(process.cwd(), 'test-results', 'catalog-api-check.json');
const RUN_ID = process.env.CATALOG_API_CHECK_RUN_ID ?? Date.now().toString(36);

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
  name: 'catalog-api-check';
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
  name: 'catalog-api-check',
  startedAt: new Date().toISOString(),
  finishedAt: '',
  success: false,
  baseUrl: BASE_URL,
  runId: RUN_ID,
  steps: [],
  endpointsChecklist: [
    { method: 'GET', path: '/health', auth: false, covered: true },
    { method: 'GET', path: '/categories/tree', auth: false, covered: true },
    { method: 'GET', path: '/categories/home', auth: false, covered: true },
    { method: 'GET', path: '/categories/:slug', auth: false, covered: true },
    { method: 'GET', path: '/products', auth: false, covered: true },
    { method: 'GET', path: '/products/:slug', auth: false, covered: true },
    { method: 'GET', path: '/search/suggestions', auth: false, covered: true },
    { method: 'GET', path: '/search', auth: false, covered: true },
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

function isProductCard(value: unknown): boolean {
  if (!isObject(value)) {
    return false;
  }
  return (
    typeof value.id === 'number' &&
    typeof value.slug === 'string' &&
    typeof value.name === 'string' &&
    typeof value.price === 'number' &&
    typeof value.stockStatus === 'string' &&
    typeof value.channel === 'string' &&
    isObject(value.seller) &&
    typeof value.seller.shopName === 'string' &&
    Array.isArray(value.badges)
  );
}

async function api(
  stepNum: number,
  name: string,
  method: string,
  path: string,
  opts: {
    headers?: Record<string, string>;
    expectStatus?: number;
    checks?: (httpStatus: number, body: unknown) => Record<string, boolean>;
  } = {},
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers ?? {}),
  };

  const started = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, { method, headers });
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

async function main(): Promise<void> {
  console.log(`\nCatalog API check → ${BASE_URL} (run ${RUN_ID})\n`);
  let step = 0;

  await api(++step, 'Health', 'GET', '/health', {
    checks: (status, body) => {
      const data = unwrapApiData<{ status?: string }>(body);
      return {
        ...envelopeOk(status, body, 200),
        healthy: data?.status === 'ok',
      };
    },
  });

  const tree = await api(++step, 'Category tree (fa)', 'GET', '/categories/tree', {
    headers: { 'x-lang': 'fa' },
    checks: (status, body) => {
      const data = unwrapApiData<Array<Record<string, unknown>>>(body);
      const root = Array.isArray(data) ? data[0] : null;
      const children = Array.isArray(root?.children) ? root.children : [];
      return {
        ...envelopeOk(status, body, 200),
        isArray: Array.isArray(data),
        hasFoodRoot: root?.slug === 'food',
        persianName: root?.name === 'مواد غذایی',
        hasChildren: children.length > 0,
        hasProductCount: typeof root?.productCount === 'number',
      };
    },
  });

  await api(++step, 'Category home', 'GET', '/categories/home', {
    headers: { 'x-lang': 'fa' },
    checks: (status, body) => {
      const data = unwrapApiData<{
        shortcuts?: Array<{ slug?: string; productCount?: number }>;
        featured?: { parent?: { slug?: string }; children?: unknown[] };
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        hasShortcuts: Array.isArray(data?.shortcuts) && data.shortcuts.length > 0,
        featuredFood: data?.featured?.parent?.slug === 'food',
        hasFeaturedChildren: Array.isArray(data?.featured?.children),
      };
    },
  });

  const sodaCategory = await api(
    ++step,
    'Category by slug soda',
    'GET',
    '/categories/soda',
    {
      headers: { 'x-lang': 'en' },
      checks: (status, body) => {
        const data = unwrapApiData<{
          category?: { slug?: string; name?: string; productCount?: number };
          ancestors?: Array<{ slug?: string }>;
          children?: unknown[];
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          slug: data?.category?.slug === 'soda',
          englishName: data?.category?.name === 'Soda',
          productCountPositive:
            typeof data?.category?.productCount === 'number' &&
            data.category.productCount > 0,
          hasAncestors: Array.isArray(data?.ancestors) && data.ancestors.length > 0,
        };
      },
    },
  );

  await api(++step, 'Unknown category slug', 'GET', '/categories/does-not-exist', {
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'CATEGORY_NOT_FOUND'),
  });

  const sodaCount =
    unwrapApiData<{ category?: { productCount?: number } }>(sodaCategory.body)
      ?.category?.productCount ?? 0;

  const productsList = await api(
    ++step,
    'Products list by categorySlug=soda',
    'GET',
    '/products?categorySlug=soda&limit=50&channel=RETAIL',
    {
      headers: { 'x-lang': 'en' },
      checks: (status, body) => {
        const data = unwrapApiData<{
          items?: unknown[];
          total?: number;
          page?: number;
          limit?: number;
        }>(body);
        const items = Array.isArray(data?.items) ? data.items : [];
        return {
          ...envelopeOk(status, body, 200),
          hasItems: items.length > 0,
          cardsValid: items.every(isProductCard),
          totalMatchesCount: data?.total === sodaCount,
          page: data?.page === 1,
          limit: data?.limit === 50,
          retailChannel: items.every(
            (item) => isObject(item) && item.channel === 'RETAIL',
          ),
        };
      },
    },
  );

  await api(
    ++step,
    'Products list pagination',
    'GET',
    '/products?categorySlug=soda&page=1&limit=1&sort=relevant',
    {
      checks: (status, body) => {
        const data = unwrapApiData<{
          items?: unknown[];
          total?: number;
          page?: number;
          limit?: number;
        }>(body);
        return {
          ...envelopeOk(status, body, 200),
          oneItem: Array.isArray(data?.items) && data.items.length === 1,
          totalAtLeastOne: typeof data?.total === 'number' && data.total >= 1,
          page: data?.page === 1,
          limit: data?.limit === 1,
        };
      },
    },
  );

  await api(
    ++step,
    'Products list cheapest sort',
    'GET',
    '/products?categorySlug=soda&sort=cheapest&limit=20',
    {
      checks: (status, body) => {
        const data = unwrapApiData<{ items?: Array<{ price?: number }> }>(body);
        const items = Array.isArray(data?.items) ? data.items : [];
        const prices = items.map((item) => item.price ?? Number.POSITIVE_INFINITY);
        const sorted = [...prices].sort((a, b) => a - b);
        return {
          ...envelopeOk(status, body, 200),
          sortedByPrice: prices.join(',') === sorted.join(','),
        };
      },
    },
  );

  await api(
    ++step,
    'Products list unknown category empty',
    'GET',
    '/products?categorySlug=does-not-exist',
    {
      checks: (status, body) => {
        const data = unwrapApiData<{ items?: unknown[]; total?: number }>(body);
        return {
          ...envelopeOk(status, body, 200),
          emptyItems: Array.isArray(data?.items) && data.items.length === 0,
          zeroTotal: data?.total === 0,
        };
      },
    },
  );

  const pepsiRetail = await api(
    ++step,
    'Product detail retail',
    'GET',
    '/products/pepsi-cola-6pk?channel=RETAIL',
    {
      headers: { 'x-lang': 'en' },
      checks: (status, body) => {
        const data = unwrapApiData<Record<string, unknown>>(body);
        const related = Array.isArray(data?.related) ? data.related : [];
        return {
          ...envelopeOk(status, body, 200),
          card: isProductCard(data),
          slug: data?.slug === 'pepsi-cola-6pk',
          wholesaleNull: data?.wholesale === null,
          hasGallery: Array.isArray(data?.gallery) && data.gallery.length > 0,
          hasCategory: isObject(data?.category) && data.category.slug === 'soda',
          relatedPresent: related.length > 0,
          relatedCards: related.every(isProductCard),
          relatedExcludesSelf: related.every(
            (item) => isObject(item) && item.slug !== 'pepsi-cola-6pk',
          ),
        };
      },
    },
  );

  await api(
    ++step,
    'Product detail wholesale',
    'GET',
    '/products/pepsi-cola-6pk?channel=WHOLESALE',
    {
      headers: { 'x-lang': 'fa' },
      checks: (status, body) => {
        const data = unwrapApiData<Record<string, unknown>>(body);
        const wholesale = isObject(data?.wholesale) ? data.wholesale : null;
        const retailPrice = unwrapApiData<{ price?: number }>(pepsiRetail.body)
          ?.price;
        return {
          ...envelopeOk(status, body, 200),
          channel: data?.channel === 'WHOLESALE',
          hasWholesale: wholesale !== null,
          hasTiers:
            wholesale !== null &&
            Array.isArray(wholesale.tiers) &&
            wholesale.tiers.length > 0,
          persianName:
            typeof data?.name === 'string' && data.name.includes('پپسی'),
          priceDiffersFromRetail:
            typeof data?.price === 'number' &&
            typeof retailPrice === 'number' &&
            data.price !== retailPrice,
        };
      },
    },
  );

  await api(++step, 'Unknown product slug', 'GET', '/products/does-not-exist', {
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'PRODUCT_NOT_FOUND'),
  });

  await api(++step, 'Unpublished product slug', 'GET', '/products/draft-soda', {
    expectStatus: 404,
    checks: (status, body) => errorOk(status, body, 404, 'PRODUCT_NOT_FOUND'),
  });

  await api(
    ++step,
    'Search suggestions chicken (fa)',
    'GET',
    '/search/suggestions?q=%D9%85%D8%B1%D8%BA',
    {
      headers: { 'x-lang': 'fa' },
      checks: (status, body) => {
        const data = unwrapApiData<{
          categorized?: Array<{ category?: { slug?: string } }>;
          terms?: string[];
        }>(body);
        const terms = Array.isArray(data?.terms) ? data.terms : [];
        return {
          ...envelopeOk(status, body, 200),
          hasCategory:
            Array.isArray(data?.categorized) &&
            data.categorized.some((item) => item.category?.slug === 'chicken'),
          hasTerms: terms.length > 0,
          hasProductTerm: terms.some((term) => term.includes('مرغ')),
        };
      },
    },
  );

  await api(++step, 'Search suggestions empty q', 'GET', '/search/suggestions?q=', {
    checks: (status, body) => {
      const data = unwrapApiData<{ categorized?: unknown[]; terms?: unknown[] }>(
        body,
      );
      return {
        ...envelopeOk(status, body, 200),
        emptyCategorized:
          Array.isArray(data?.categorized) && data.categorized.length === 0,
        emptyTerms: Array.isArray(data?.terms) && data.terms.length === 0,
      };
    },
  });

  await api(
    ++step,
    'Search catalog chicken',
    'GET',
    '/search?q=chicken&page=1&limit=20&channel=RETAIL',
    {
      headers: { 'x-lang': 'en' },
      checks: (status, body) => {
        const data = unwrapApiData<{
          query?: string;
          products?: { items?: unknown[]; total?: number };
          categories?: Array<{ slug?: string; productCount?: number }>;
        }>(body);
        const items = Array.isArray(data?.products?.items)
          ? data.products.items
          : [];
        return {
          ...envelopeOk(status, body, 200),
          query: data?.query === 'chicken',
          productHits: items.length > 0,
          cardsValid: items.every(isProductCard),
          categoryHit:
            Array.isArray(data?.categories) &&
            data.categories.some((category) => category.slug === 'chicken'),
        };
      },
    },
  );

  await api(
    ++step,
    'Search catalog with categoryId + wholesale channel',
    'GET',
    '/search?q=&categoryId=18&channel=WHOLESALE&sort=cheapest&limit=20',
    {
      checks: (status, body) => {
        const data = unwrapApiData<{
          products?: { items?: Array<{ channel?: string; slug?: string }> };
          categories?: unknown[];
        }>(body);
        const items = Array.isArray(data?.products?.items)
          ? data.products.items
          : [];
        return {
          ...envelopeOk(status, body, 200),
          emptyCategories:
            Array.isArray(data?.categories) && data.categories.length === 0,
          hasSodaProducts: items.length > 0,
          wholesaleChannel: items.every((item) => item.channel === 'WHOLESALE'),
        };
      },
    },
  );

  await api(++step, 'Search catalog empty query', 'GET', '/search?q=', {
    checks: (status, body) => {
      const data = unwrapApiData<{
        query?: string;
        products?: { items?: unknown[]; total?: number };
        categories?: unknown[];
      }>(body);
      return {
        ...envelopeOk(status, body, 200),
        emptyQuery: data?.query === '',
        emptyCategories:
          Array.isArray(data?.categories) && data.categories.length === 0,
        emptyOrPagedProducts: Array.isArray(data?.products?.items),
      };
    },
  });

  const listTotal = unwrapApiData<{ total?: number }>(productsList.body)?.total;
  logStep({
    step: ++step,
    name: 'ASSERT category productCount equals products list total',
    method: 'ASSERT',
    path: '/categories/soda ↔ /products?categorySlug=soda',
    ok: sodaCount > 0 && sodaCount === listTotal,
    checks: {
      sodaCountPositive: sodaCount > 0,
      totalsMatch: sodaCount === listTotal,
    },
  });

  const treeRoots = unwrapApiData<Array<Record<string, unknown>>>(tree.body);
  const food = Array.isArray(treeRoots) ? treeRoots[0] : null;
  logStep({
    step: ++step,
    name: 'ASSERT category tree still nests under food',
    method: 'ASSERT',
    path: '/categories/tree',
    ok: food?.slug === 'food' && Array.isArray(food.children),
    checks: {
      foodRoot: food?.slug === 'food',
      nested: Array.isArray(food?.children) && food.children.length > 0,
    },
  });

  const out = saveReport();
  console.log(
    `\n${report.success ? 'PASS' : 'FAIL'} — ${report.steps.filter((s) => s.ok).length}/${report.steps.length} steps`,
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
