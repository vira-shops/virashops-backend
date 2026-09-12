import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { I18nModule } from 'nestjs-i18n';
import request from 'supertest';
import { App } from 'supertest/types';
import { i18nConfig } from '../src/config/i18n.config';
import GetCategoryBySlugUseCase from '../src/modules/categories/domain/application/usecases/get-category-by-slug.usecase';
import GetCategoryTreeUseCase from '../src/modules/categories/domain/application/usecases/get-category-tree.usecase';
import GetHomeCategoriesUseCase from '../src/modules/categories/domain/application/usecases/get-home-categories.usecase';
import InMemoryCategoryRepository from '../src/modules/categories/domain/application/usecases/in-memory-category.repository';
import SearchCategoriesUseCase from '../src/modules/categories/domain/application/usecases/search-categories.usecase';
import CategoriesController from '../src/modules/categories/interfaces/http/controllers/categories.controller';
import { CATEGORY_REPOSITORY } from '../src/modules/categories/shared/tokens/port.token';
import CountPublishedProductsUseCase from '../src/modules/products/domain/application/usecases/count-published-products.usecase';
import GetProductBySlugUseCase from '../src/modules/products/domain/application/usecases/get-product-by-slug.usecase';
import InMemoryProductRepository from '../src/modules/products/domain/application/usecases/in-memory-product.repository';
import ListProductsUseCase from '../src/modules/products/domain/application/usecases/list-products.usecase';
import ProductsController from '../src/modules/products/interfaces/http/controllers/products.controller';
import { PRODUCT_REPOSITORY } from '../src/modules/products/shared/tokens/port.token';
import SearchCatalogUseCase from '../src/modules/search/domain/application/usecases/search-catalog.usecase';
import SuggestSearchUseCase from '../src/modules/search/domain/application/usecases/suggest-search.usecase';
import SearchController from '../src/modules/search/interfaces/http/controllers/search.controller';
import DomainExceptionFilter from '../src/modules/shared/interface/http/filters/domain-exception.filter';
import ApiEnvelopeInterceptor from '../src/modules/shared/interface/http/interceptors/api-envelope.interceptor';

type ApiEnvelope<T> = { status: number; data: T };

function apiBody<T>(res: { body: unknown }): ApiEnvelope<T> {
  return res.body as ApiEnvelope<T>;
}

describe('Catalog HTTP', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [I18nModule.forRoot(i18nConfig)],
      controllers: [CategoriesController, ProductsController, SearchController],
      providers: [
        GetCategoryTreeUseCase,
        GetHomeCategoriesUseCase,
        GetCategoryBySlugUseCase,
        SearchCategoriesUseCase,
        SuggestSearchUseCase,
        SearchCatalogUseCase,
        ListProductsUseCase,
        GetProductBySlugUseCase,
        CountPublishedProductsUseCase,
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ApiEnvelopeInterceptor },
        { provide: CATEGORY_REPOSITORY, useClass: InMemoryCategoryRepository },
        { provide: PRODUCT_REPOSITORY, useClass: InMemoryProductRepository },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns the mega-menu tree', async () => {
    const response = await request(app.getHttpServer())
      .get('/categories/tree')
      .set('x-lang', 'fa')
      .expect(200);

    const body =
      apiBody<Array<{ slug: string; name: string; children: unknown[] }>>(
        response,
      );
    expect(body.status).toBe(200);
    expect(body.data[0].slug).toBe('food');
    expect(body.data[0].name).toBe('مواد غذایی');
    expect(body.data[0].children).toHaveLength(2);
  });

  it('returns homepage shortcuts and featured grid', async () => {
    const response = await request(app.getHttpServer())
      .get('/categories/home')
      .expect(200);
    const body = apiBody<{
      shortcuts: Array<{ slug: string }>;
      featured: { parent: { slug: string; productCount: number } };
    }>(response);
    expect(body.data.shortcuts.map((item) => item.slug)).toEqual([
      'staples',
      'protein',
    ]);
    expect(body.data.featured.parent.slug).toBe('food');
  });

  it('returns a category by slug and 404s unknown slugs', async () => {
    const found = await request(app.getHttpServer())
      .get('/categories/staples')
      .set('x-lang', 'en')
      .expect(200);
    const detail = apiBody<{
      category: { name: string };
      ancestors: Array<{ slug: string }>;
      children: Array<{ slug: string; productCount: number }>;
    }>(found);
    expect(detail.data.category.name).toBe('Staples');
    expect(detail.data.ancestors[0].slug).toBe('food');
    expect(detail.data.children[0].slug).toBe('bread');
    expect(detail.data.children[0].productCount).toBe(1);

    const missing = await request(app.getHttpServer())
      .get('/categories/does-not-exist')
      .expect(404);
    expect(apiBody<{ errorCode: string }>(missing).data.errorCode).toBe(
      'CATEGORY_NOT_FOUND',
    );
  });

  it('lists published products with pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ page: 1, limit: 2, categorySlug: 'soda' })
      .set('x-lang', 'en')
      .expect(200);
    const body = apiBody<{
      items: Array<{ slug: string; price: number; channel: string }>;
      total: number;
      page: number;
      limit: number;
    }>(response);
    expect(body.data.total).toBe(2);
    expect(body.data.items).toHaveLength(2);
    expect(body.data.items[0].slug).toBe('pepsi-cola-6pk');
    expect(body.data.items[0].channel).toBe('RETAIL');
  });

  it('returns product detail with related recommendations', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/pepsi-cola-6pk')
      .query({ channel: 'WHOLESALE' })
      .set('x-lang', 'fa')
      .expect(200);
    const body = apiBody<{
      slug: string;
      price: number;
      wholesale: { cashPrice: number } | null;
      related: Array<{ slug: string }>;
    }>(response);
    expect(body.data.slug).toBe('pepsi-cola-6pk');
    expect(body.data.price).toBe(2400000);
    expect(body.data.wholesale?.cashPrice).toBe(2400000);
    expect(body.data.related.map((item) => item.slug)).toContain(
      'coca-cola-6pk',
    );
  });

  it('404s unknown or unpublished product slugs', async () => {
    const missing = await request(app.getHttpServer())
      .get('/products/does-not-exist')
      .expect(404);
    expect(apiBody<{ errorCode: string }>(missing).data.errorCode).toBe(
      'PRODUCT_NOT_FOUND',
    );

    const draft = await request(app.getHttpServer())
      .get('/products/draft-soda')
      .expect(404);
    expect(apiBody<{ errorCode: string }>(draft).data.errorCode).toBe(
      'PRODUCT_NOT_FOUND',
    );
  });

  it('returns search suggestions for a category name', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/suggestions')
      .query({ q: 'مرغ' })
      .set('x-lang', 'fa')
      .expect(200);
    const body = apiBody<{
      categorized: Array<{ text: string; category: { slug: string } }>;
      terms: string[];
    }>(response);
    expect(body.data.categorized[0].category.slug).toBe('chicken');
    expect(body.data.terms).toEqual(
      expect.arrayContaining(['مرغ', 'سینه مرغ تازه']),
    );
  });

  it('returns matching products and categories from GET /search', async () => {
    const response = await request(app.getHttpServer())
      .get('/search')
      .query({
        q: 'chicken',
        page: 1,
        limit: 20,
        sort: 'relevance',
        categoryId: 15,
        minPrice: 0,
        maxPrice: 1000000,
        channel: 'RETAIL',
      })
      .expect(200);
    const body = apiBody<{
      query: string;
      products: {
        items: Array<{ slug: string }>;
        total: number;
        page: number;
        limit: number;
      };
      categories: Array<{ slug: string }>;
    }>(response);
    expect(body.data.query).toBe('chicken');
    expect(body.data.products.items.map((item) => item.slug)).toContain(
      'chicken-breast-1kg',
    );
    expect(body.data.products.page).toBe(1);
    expect(body.data.products.limit).toBe(20);
    expect(body.data.categories.map((category) => category.slug)).toEqual([
      'chicken',
    ]);
  });
});
