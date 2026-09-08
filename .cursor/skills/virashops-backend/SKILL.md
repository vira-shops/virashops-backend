---
name: virashops-backend
description: >-
  Implements the Virashops NestJS backend as Hexagonal Architecture + DDD Lite.
  Use when adding or changing bounded contexts, use cases, ports, adapters,
  Drizzle persistence, tRPC/REST APIs, auth/RBAC, sellers, products, inventory,
  carts, orders, payments, notifications, or when the user mentions hexagonal,
  domain, or backend workflow.
---

# Virashops backend

Next.js owns presentation. This repo owns **business truth**. tRPC owns the internal typed contract with the web app. PostgreSQL owns durable transactional state. Redis owns cache, sessions, and async coordination. S3/MinIO owns files. Hexagonal + DDD Lite keeps domain independent of all of that.

NestJS is the **framework**, not the architecture. Controllers/procedures must not contain business rules. Domain must not import Drizzle, Nest HTTP, or DTOs.

## Stack

| Piece | Choice | Role |
|---|---|---|
| Host | NestJS + TypeScript | Modules, DI, guards, pipes |
| Architecture | Hexagonal + DDD Lite | Bounded modules, entities, invariants, ports |
| Persistence | PostgreSQL + Drizzle | Durable commerce state, migrations |
| Cache / jobs | Redis + Bull | Sessions, cache, retries — not source of truth |
| Files | MinIO / S3 | Images and uploads, never in Postgres |
| Auth | JWT + sessions | API auth; OAuth later |
| Validation | class-validator (HTTP) / Zod (tRPC) | At the presentation boundary only |
| Tests | Jest, Supertest, Testcontainers | Unit → integration → HTTP → real infra |

Do not replace Postgres with Redis. Do not put files in Postgres.

## Ownership

**Backend does**

- Authoritative prices, totals, inventory, payment outcomes, authorization
- Invariants and state transitions on domain models
- Persistence, queues, file storage, external providers

**Backend does not**

- UI layout, React, or frontend styling
- Return Drizzle rows as public API
- Trust client-calculated prices, totals, or permissions
- Mix infrastructure into domain

## Dependency direction

```
Presentation (tRPC / HTTP / webhooks)
  → Application (one use case per action)
    → Domain (model, invariants, ports)
         ▲
Infrastructure implements ports (Drizzle, Redis, S3, payments, email)
```

Use cases inject **ports via `Symbol` tokens**, never adapters.

Cross-module: call another module’s **use case**, or emit a domain event. Never import another module’s entity, mapper, or repository adapter.

## Bounded modules (Postgres)

Own data in the matching module. Do not reach across tables via Drizzle relations from another context.

```
users, addresses, preferences
roles, permissions
sellers, profiles, bank details
categories, products, variants, attributes, images, inventory
carts, cart_items
orders, order_items, status_history, tracking
payments, transactions, refunds, settlements
notifications
```

Search MVP: Postgres `tsvector` / trigram. Do not add Elasticsearch until that is insufficient.

## Implementation workflow

Copy and track:

```
- [ ] 1. Requirement — business behavior and invariants
- [ ] 2. Module — which bounded context
- [ ] 3. Domain — model, value objects, state transitions, DomainError
- [ ] 4. Use case — Command/Query + execute()
- [ ] 5. Port + token — repository or provider interface
- [ ] 6. Adapter — Drizzle / Redis / S3 / vendor
- [ ] 7. API — tRPC procedure or HTTP; DTO → Command; never entities
- [ ] 8. Tests — unit (mock ports) → integration → HTTP/E2E
- [ ] 9. Review — security, architecture, failure paths
```

Folder tree, naming, and Nest wiring: [hexagonal.md](hexagonal.md).

## API

- **tRPC**: primary contract with the Next.js app. Procedures call use cases. Infer types from the backend; do not duplicate DTOs in the frontend.
- **REST / webhooks**: external providers, public APIs, third-party integrations. Do not force tRPC onto those boundaries.

Presentation maps DTO → Command/Query, calls `useCase.execute`, maps the result. Throw `DomainError`; let `DomainExceptionFilter` render HTTP. Controllers do not catch domain errors to set status codes.

Frontend consumes **contracts**, never domain models, Drizzle rows, or adapters.

## Vertical slice — add to cart

Backend must: validate product and variant, check inventory, resolve **authoritative price**, apply cart rules, persist cart/item.

Tests: unit (quantity/inventory rules), integration (Postgres), HTTP/tRPC, Docker smoke (app + Postgres + Redis).

## Testing

| Kind | What | How |
|---|---|---|
| Unit | Use case + domain | Mock **ports**; real models; assert `DomainError`; no Nest boot |
| Integration | Adapters | Real DB/Redis (`*.int-spec.ts`, Testcontainers) |
| HTTP | Presentation | Supertest through the app boundary |
| Runtime | Wiring | Docker compose + smoke |

Colocate unit tests next to the use case: `<action>.usecase.spec.ts`.

## AI vs human

| Stage | Agent | Human |
|---|---|---|
| Plan | Vertical slice, files, ports | Approve domain rules |
| Implement | Use case + adapters + API | Review business logic |
| Test | Unit/integration/HTTP specs | Validate scenarios |
| Review | Architecture/security gaps | Final approval |

Do not generate a feature without an explicit module + invariants. Do not skip the domain model and dump logic in a Nest `@Injectable()` service.

## Do not add yet

Microservices per module, Kafka, Elasticsearch, GraphQL, Kubernetes, or extra DDD patterns that do not solve a current problem.

Build a **modular monolith** with clean boundaries so extraction is possible later.
