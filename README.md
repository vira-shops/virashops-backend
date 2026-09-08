# Virashops backend

NestJS API structured as hexagonal architecture (ports and adapters). Layout, naming, and dependency rules are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

NestJS, TypeScript, Drizzle (PostgreSQL), Redis, nestjs-i18n, Swagger.

## Setup

Local API with Docker for Postgres and Redis:

```bash
cp .env.example .env
docker compose up -d --wait
npm install
npm run migration:run
npm run start:dev
```

- API: `http://localhost:3000`
- Health: `GET http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`

Optional MinIO (S3) and/or API container:

```bash
docker compose --profile files up -d          # MinIO at :9000, console :9001
docker compose --profile app up -d --build --wait   # API in Docker too
```

`--profile app` starts Postgres, Redis, and the API. It does not start MinIO; seller uploads then use local `uploads/` unless `AWS_S3_BUCKET` is set. Combine `--profile app --profile files` when the API should talk to MinIO.

## Live API contract check (Docker)

Black-box HTTP checks against a running API (not Jest). Playbook: [docs/API-CHECK.md](docs/API-CHECK.md).

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d postgres redis api --wait
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm auth-api-check
```

Host fallback if the API is already on `:3000`:

```bash
npm run auth-api-check
```

## Scripts

```bash
npm run start:dev          # watch mode
npm run test               # unit tests (use-case specs, no Nest boot)
npm run test:e2e
npm run auth-api-check      # live HTTP contract vs a running API
npm run migration:generate
npm run migration:run
npm run db:studio
```

Git hooks (Husky + lint-staged) run ESLint and Prettier on staged TypeScript files before each commit. They are installed automatically via `npm install` (`prepare` script).

## Adding a feature

Follow the checklist in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Duplicate the canonical tree under `src/modules/<feature>/`, then import the interface module in `app.module.ts`.
