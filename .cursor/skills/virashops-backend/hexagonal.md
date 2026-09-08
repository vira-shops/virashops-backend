# Hexagonal layout (this repo)

Use this tree for every bounded context. Default-export classes. File names are kebab-case.

```
src/modules/<feature>/
  interfaces/
    <feature>.module.ts              composition root (use cases + controllers)
    http/
      controllers/
      dto/                           class-validator + Swagger only
      mappers/                       DTO ↔ Command / Query / HTTP
      guards/
  domain/
    model/<name>.model.ts            rich entity; create / getId / behavior
    model/enums/
    ports/<name>.repository.port.ts
    errors/<name>.error.ts           extends DomainError
    view-models/
    application/
      commands/
      queries/
      usecases/<action>.usecase.ts
      usecases/<action>.usecase.spec.ts
      services/                      shared by several use cases only
  infrastructure/
    infrastructure.module.ts         token → adapter
    drizzle/
      schema/<name>.ts               pgTable + relations
      mappers/<name>.mapper.ts       toDomain
      repositories/<name>.repository.adapter.ts
    <vendor>/
  shared/
    tokens/port.token.ts             Symbol('NAME') matches constant name
    events/                          <module>.<thing>-<happened>
```

App-wide: `src/modules/shared/` (hasher, JWT, S3, email, Redis, `DomainError`). `src/database/` is the Drizzle client, schema barrel, and migrations runner. `src/common/` is pagination and request typings — no business rules.

`app.module.ts` only wires Config, Drizzle, i18n, EventEmitter, `CoreInfrastructureModule`, and feature modules.

## Naming

| Thing | Pattern |
|---|---|
| Feature folder | kebab-case plural (`carts`, `orders`) |
| Port | `<Name>RepositoryPort` |
| Adapter | `Drizzle<Name>RepositoryAdapter` |
| Use case | `<Verb><Name>UseCase` + `execute` |
| Command / Query | `<Verb><Name>Command` / `Query` |
| HTTP DTO | `<Verb><Name>HttpDto` |
| Token | `SCREAMING_SNAKE` + `_REPOSITORY` / `_SERVICE` |
| Domain error | `<Name><Problem>Error` + `ErrorCode` + `src/i18n/en/errors.json` |

## Two Nest modules

Infrastructure binds tokens and exports them. Interface module imports infrastructure, registers controllers and use cases, exports a use case only if another module must call it.

```ts
{ provide: CART_REPOSITORY, useClass: DrizzleCartRepositoryAdapter }
```

```ts
@Inject(CART_REPOSITORY)
private readonly cartRepo: CartRepositoryPort
```

## Import rule

| From | May import | Must not |
|---|---|---|
| `domain/model` | domain, module `shared/enums`, `common/enums` | Drizzle, Nest HTTP, DTOs |
| `domain/application` | ports, models, commands, tokens | schema, HTTP DTOs |
| `infrastructure` | ports, models, Drizzle, vendor SDKs | controllers, HTTP DTOs |
| `interfaces` | use cases, commands, DTOs, guards | schema, repository adapters |

Add `ErrorCode` + i18n string whenever you add a `DomainError`.
