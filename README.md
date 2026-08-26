# Virashops backend

NestJS API structured as hexagonal architecture (ports and adapters). Layout, naming, and dependency rules are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

NestJS, TypeScript, TypeORM (PostgreSQL), Redis, nestjs-i18n, Swagger.

## Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

- API prefix: `/api`
- Health: `GET /health`
- Swagger: `/docs`

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
