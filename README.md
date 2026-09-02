# Virashops backend

NestJS API structured as hexagonal architecture (ports and adapters). Layout, naming, and dependency rules are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

NestJS, TypeScript, TypeORM (PostgreSQL), Redis, nestjs-i18n, Swagger.

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

## Scripts

```bash
npm run start:dev          # watch mode
npm run test               # unit tests (use-case specs, no Nest boot)
npm run test:e2e
npm run migration:generate -- src/migrations/Name
npm run migration:run
npm run migration:revert
```

## Adding a feature

Follow the checklist in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Duplicate the canonical tree under `src/modules/<feature>/`, then import the interface module in `app.module.ts`.
