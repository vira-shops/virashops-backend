# Hexagonal architecture (ports and adapters)

This document is the playbook for how this backend is structured. Copy it into another NestJS project and follow it as the source of truth for folders, naming, dependency rules, and how to add a new bounded context.

Stack assumed: **NestJS + TypeScript + TypeORM**. The ideas apply to other frameworks; the file layout and DI tokens are Nest-specific.

---

## Why this shape

Business rules live in the **domain**. HTTP, TypeORM, S3, Redis, email, and third-party APIs live on the **outside**. They talk to the domain through **ports** (interfaces). **Adapters** implement those ports.

That split exists so you can:

- Change the database, payment provider, or HTTP contract without rewriting use cases.
- Unit-test use cases by mocking ports.
- Keep each feature (bounded context) isolated in its own module.

```
                    ┌─────────────────────────────────────┐
                    │         driving adapters            │
                    │  HTTP controllers, CLI, webhooks    │
                    └─────────────────┬───────────────────┘
                                      │  DTO → Command / Query
                                      ▼
                    ┌─────────────────────────────────────┐
                    │              domain                 │
                    │  models, use cases, domain errors   │
                    │  ports (interfaces only)            │
                    └─────────────────┬───────────────────┘
                                      │  @Inject(TOKEN)
                                      ▼
                    ┌─────────────────────────────────────┐
                    │        driven adapters              │
                    │  TypeORM repositories, S3, Redis,   │
                    │  email, Qonto HTTP, …               │
                    └─────────────────────────────────────┘
```

- **Driving (inbound)** adapters call use cases.
- **Driven (outbound)** adapters are called *by* use cases through ports.

---

## Repository layout

```
src/
  main.ts                         bootstrap, global pipes/filters
  app.module.ts                   imports feature modules only
  config/                         TypeORM, env, swagger
  common/                         framework-wide primitives (CoreEntity, pagination)
  i18n/<lang>/errors.json         DomainError messages keyed by ErrorCode
  modules/
    shared/                       cross-cutting ports + adapters (hash, JWT, S3, email, Redis)
    <feature>/                    one bounded context (patients, schedule, payments, …)
```

`app.module.ts` must not contain business logic. It only wires TypeORM, i18n, Redis, and feature modules.

---

## One feature module (canonical tree)

Use **this** tree for every new bounded context. Names in angle brackets are examples.

```
src/modules/<feature>/
  interfaces/
    <feature>.module.ts                 Nest composition root (use cases + controllers)
    http/
      controllers/<name>.controller.ts
      dto/<name>.dto.ts                 class-validator + Swagger only
      mappers/<name>.mapper.ts          DTO ↔ Command / Query / HTTP response
      guards/                           HTTP auth for this module (optional)
  domain/
    model/<name>.model.ts               rich entity, no TypeORM, no Nest HTTP
    model/enums/                        domain enums used by the model
    ports/<name>.repository.port.ts     outbound contract (no implementation)
    errors/<name>.error.ts              extends DomainError
    view-models/                        read models when the aggregate is too heavy
    application/
      commands/<action>.command.ts      write input (plain class)
      queries/<action>.query.ts         read input (plain class)
      usecases/<action>.usecase.ts      one application action
      usecases/<action>.usecase.spec.ts
      services/<name>.service.ts        helpers used by several use cases
  infrastructure/
    infrastructure.module.ts            binds tokens → adapters, registers entities
    typeorm/
      entities/<name>.entity.ts
      mappers/<name>.mapper.ts          Entity ↔ domain model
      repositories/<name>.repository.adapter.ts
    <vendor>/                           e.g. qonto/, osrm/, s3/
  shared/
    tokens/port.token.ts                Symbol() DI tokens
    enums/
    types/
    events/                             EventEmitter2 payload classes
    utils/                              pure functions used across layers of this module
```

Folder names that are **canonical** in this repo:

| Layer | Folder | Notes |
|---|---|---|
| Inbound | `interfaces/` | Prefer plural. A few older modules use `interface/`. |
| Domain model | `domain/model/` | Singular. |
| Application | `domain/application/` | Use cases live *inside* domain, not next to it. |
| Persistence | `infrastructure/typeorm/` | Never import TypeORM from `domain/`. |
| Module-local shared | `<feature>/shared/` | Tokens, events, enums for *this* module only. |
| App-wide shared | `modules/shared/` | Password hasher, token service, S3, email, Redis. |

---

## Dependency rule (non-negotiable)

Imports may only point **inward**.

```
interfaces  →  domain  →  ports
     │                        ▲
     │                        │ implements
     └──── infrastructure ────┘
```

| From | May import | Must not import |
|---|---|---|
| `domain/model` | other domain models, `shared/enums`, `common/enums` | TypeORM, Nest HTTP, DTOs, adapters |
| `domain/ports` | domain models, commands, queries | adapters, entities, Nest HTTP |
| `domain/application` | ports, models, commands, other use cases, `shared/tokens` | TypeORM entities, HTTP DTOs, controllers |
| `infrastructure` | ports, models, TypeORM, vendor SDKs | controllers, HTTP DTOs |
| `interfaces` | use cases, commands, DTOs, guards | TypeORM entities, repository adapters |
| `shared/tokens` | nothing (Symbols only) | — |

**Use cases inject ports, never adapters.**

```ts
@Inject(PATIENT_REPOSITORY)
private readonly patientRepo: PatientRepositoryPort
```

Never:

```ts
constructor(private readonly repo: TypeOrmPatientRepositoryAdapter) {}
```

Cross-module: a use case may call **another module’s use case** or listen to **domain events**. It must not reach into another module’s TypeORM entities.

---

## Layer contracts

### 1. Domain model

A TypeScript class with identity, invariants, and behavior. Not a TypeORM entity.

- Encapsulate mutable identity (`id`) behind `getId()` / `setId()`.
- Put state transitions on the model (`assignDriver`, `markStarted`, `updateInfo`).
- Prefer a static factory for creation (`Patient.create(...)`).
- No `@Injectable()`, no `@Column()`, no `class-validator`.

```ts
export default class Patient {
  constructor(
    private id: number | undefined,
    public name: string,
    public companyId: number,
    // ...
  ) {}

  static create(props: { name: string; companyId: number /* ... */ }) {
    return new Patient(undefined, props.name, props.companyId);
  }

  getId(): number | undefined {
    return this.id;
  }

  setId(id: number): void {
    this.id = id;
  }
}
```

### 2. Port

An interface describing what the domain needs from the outside. One port per persistence aggregate (or per external service).

File: `domain/ports/<name>.repository.port.ts`

```ts
import Patient from '../model/patient.model';

export default interface PatientRepositoryPort {
  save(patient: Patient): Promise<Patient>;
  findById(patientId: number, companyId: number): Promise<Patient | null>;
  delete(patientId: number, companyId: number): Promise<void>;
}
```

For technical services that many modules need (hashing, JWT, S3, email), put the port in `modules/shared/application/ports/` and the token in `modules/shared/tokens/port.tokens.ts`.

### 3. DI token

TypeScript interfaces are erased at runtime. Bind every port with a `Symbol` in `<feature>/shared/tokens/port.token.ts`.

```ts
export const PATIENT_REPOSITORY = Symbol('PATIENT_REPOSITORY');
export const PATIENT_NOTIFIER = Symbol('PATIENT_NOTIFIER');
```

Naming: `SCREAMING_SNAKE` + role (`_REPOSITORY`, `_SERVICE`). The string inside `Symbol(...)` must match the constant name.

### 4. Command / Query

Plain classes. No Nest decorators. These are the only input types a use case accepts.

- **Command** = write (`CreatePatientCommand`, `AssignDriverCommand`).
- **Query** = read (`FindAllPatientsQuery`).

The HTTP mapper builds them from DTOs + auth context (`req.company.getId()`). Use cases never see `Request` or class-validator DTOs.

### 5. Use case

One class, one `execute(...)`, one business action. `@Injectable()`.

```ts
@Injectable()
export default class CreatePatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepo: PatientRepositoryPort,
  ) {}

  async execute(cmd: CreatePatientCommand): Promise<boolean> {
    const patient = Patient.create({
      name: cmd.name,
      companyId: cmd.companyId,
      // ...
    });
    const saved = await this.patientRepo.save(patient);
    return Boolean(saved.getId());
  }
}
```

Rules:

- Orchestrate: load → decide → mutate model → save → notify.
- Throw `DomainError` subclasses, not `HttpException` / `NotFoundException`.
- Keep HTTP mapping out. Return a domain object, a view-model, or a small application DTO.
- Application **services** (`domain/application/services/`) are for logic shared by several use cases (presenters, notifiers, resolvers). They are not a dumping ground for controllers.

### 6. Domain errors

Full playbook: [ERRORHANDLING.md](./ERRORHANDLING.md). Every business failure is a class extending `DomainError`.

```ts
// modules/shared/domain/errors/domain-error.ts
export abstract class DomainError extends Error {
  abstract code: string;
  abstract status: HttpStatus;
  metadata?: Record<string, string>;
}
```

```ts
export default class PatientNotFoundError extends DomainError {
  code = ErrorCode.PATIENT_NOTFOUND;
  status = HttpStatus.NOT_FOUND;
}
```

Then:

1. Add the code to `modules/shared/domain/errors/error-codes.ts`.
2. Add the user-facing string to `src/i18n/en/errors.json` under that code.
3. `DomainExceptionFilter` translates `errors.${code}` and returns `{ status, errorCode, message, path, timestamp }`.

Controllers do not catch domain errors to wrap them as HTTP. Let the filter do it.

### 7. TypeORM entity + mapper (driven adapter)

Entity = persistence. Mapper = the only place entity and model meet.

```
infrastructure/typeorm/entities/<name>.entity.ts
infrastructure/typeorm/mappers/<name>.mapper.ts
infrastructure/typeorm/repositories/<name>.repository.adapter.ts
```

- Entity extends `CoreEntity` (`id`, `created_at`, `updated_at`, `deleted_at`).
- Adapter **implements** the port and returns **domain models**, never entities.
- Mapper is a static class: `toDomain(entity)`, `toEntity(domain)`.

```ts
@Injectable()
export default class TypeOrmPatientRepositoryAdapter
  implements PatientRepositoryPort
{
  constructor(
    @InjectRepository(PatientEntity)
    private readonly repo: Repository<PatientEntity>,
  ) {}

  async findById(id: number, companyId: number): Promise<Patient | null> {
    const entity = await this.repo.findOne({ where: { id, companyId } });
    return entity ? PatientMapper.toDomain(entity) : null;
  }
}
```

### 8. HTTP (driving adapter)

Controller responsibilities, and nothing else:

1. Auth / permission guards.
2. Validate the DTO.
3. Map DTO → Command / Query (mapper).
4. Call `useCase.execute(...)`.
5. Map the result to the HTTP contract.

```ts
@Post()
async create(@Req() req: Request, @Body() dto: CreatePatientHttpDto) {
  const cmd = CreatePatientMapper.toCommand(dto, req.company.getId());
  await this.createPatientUseCase.execute(cmd);
  return PatientContractMapper.ok(
    PatientContractMapper.toSuccessResponse(),
    HttpStatus.CREATED,
  );
}
```

DTOs may use `class-validator` and `@ApiProperty`. They must not be imported by domain.

---

## Wiring (two Nest modules per feature)

Every feature has **two** Nest modules.

### Infrastructure module

Binds tokens to adapters. Exports the tokens so use cases can inject them.

```ts
@Module({
  imports: [TypeOrmModule.forFeature([PatientEntity])],
  providers: [
    { provide: PATIENT_REPOSITORY, useClass: TypeOrmPatientRepositoryAdapter },
  ],
  exports: [TypeOrmModule, PATIENT_REPOSITORY],
})
export default class PatientInfrastructureModule {}
```

### Interface module (composition root)

Registers controllers, use cases, and application services. Imports the infrastructure module (and other features it needs).

```ts
@Module({
  imports: [PatientInfrastructureModule, CompanyModule],
  controllers: [PatientController],
  providers: [
    CreatePatientUseCase,
    FindAllPatientsUseCase,
    UpdatePatientUseCase,
    RemovePatientUseCase,
  ],
  exports: [PatientInfrastructureModule, CreatePatientUseCase],
})
export default class PatientModule {}
```

Then import `PatientModule` in `app.module.ts`.

Export a use case only when another module must call it. Export the infrastructure module when another module needs the **port token** (rare; prefer calling a use case).

---

## Request flow (end to end)

Example: `POST /patients`

```
HTTP DTO
  → interfaces/http/mappers/create-patient.mapper.ts   (DTO + companyId → Command)
  → CreatePatientUseCase.execute(cmd)
      → Patient.create(...)                            (domain)
      → PatientRepositoryPort.save(...)                (port)
          → TypeOrmPatientRepositoryAdapter            (adapter)
              → PatientMapper.toEntity / toDomain
  → HTTP mapper wraps the result
  → DomainError? → DomainExceptionFilter → i18n errors.json
```

---

## Cross-module communication

Pick **one** of these, in this order:

1. **Call a use case** from the other module (import that module, inject the use case). Used when the other context must enforce its own invariants (e.g. start a shift when a trip starts).
2. **Emit a domain event** via `EventEmitter2` from `shared/events/`. Name: `<module>.<thing>-<happened>` (e.g. `schedule.trip-position-changed`). Listeners live in the consuming module. Use this for fan-out (live monitoring, notifications) so the producer does not know its consumers.
3. **Do not** import another module’s entity, mapper, or repository adapter.

If two modules need each other, use `forwardRef(() => OtherModule)` on both sides. Treat that as a smell — a domain event is usually cleaner.

---

## Shared kernel

`src/modules/shared/` is not a feature. It holds technical ports used by many modules:

| Token | Port | Adapter |
|---|---|---|
| `PASSWORD_HASHER` | `password-hasher.port.ts` | `security/password-hasher.adapter.ts` |
| `TOKEN_SERVICE` | `token-service.port.ts` | `security/token.service.adapter.ts` |
| `FILE_STORAGE_SERVICE` | `s3-storage.service.port.ts` | `storage/s3-storage.adapter.ts` |
| `EMAIL_SERVICE` | `email.service.port.ts` | `services/email.service.adapter.ts` |
| `TOTP_SERVICE` | `totp.service.port.ts` | `services/totp.service.adapter.ts` |

Bind them in `CoreInfrastructureModule` and import that module from any feature that needs them.

Also in shared:

- `domain/errors/domain-error.ts` + `error-codes.ts`
- `interface/http/filters/domain-exception.filter.ts`
- Redis (`infrastructure/redis/`)

`src/common/` is thinner: `CoreEntity`, pagination helpers, gender enum, request typings. Do not put business rules there.

---

## Naming cheat sheet

| Thing | Pattern | Example |
|---|---|---|
| Feature folder | kebab-case plural | `patients`, `shifts` |
| Domain model | `<Name>` default export | `patient.model.ts` → `Patient` |
| Port | `<Name>RepositoryPort` | `patient.repository.port.ts` |
| Adapter | `TypeOrm<Name>RepositoryAdapter` | `patient.repository.adapter.ts` |
| Use case | `<Verb><Name>UseCase` + `execute` | `create-patient.usecase.ts` |
| Command | `<Verb><Name>Command` | `create-patient.command.ts` |
| Query | `<Verb><Name>Query` | `find-all-patients.query.ts` |
| HTTP DTO | `<Verb><Name>HttpDto` or `<Name>Dto` | `create-patient.dto.ts` |
| HTTP mapper | `<Verb><Name>Mapper` with `toCommand` | `create-patient.mapper.ts` |
| Domain error | `<Name><Problem>Error` | `PatientNotFoundError` |
| Interface module | `<Name>Module` in `interfaces/` | `patient.module.ts` |
| Infra module | `<Name>InfrastructureModule` | `infrastructure.module.ts` |
| Event const | `<MODULE>_<THING>_<HAPPENED>` | `TRIP_POSITION_CHANGED` |
| File names | kebab-case | `start-trip.usecase.ts` |
| Classes | default export (this repo’s convention) | `export default class …` |

---

## Testing

Colocate unit tests next to the use case: `<action>.usecase.spec.ts`.

- Mock **ports**, not TypeORM.
- Build domain models with real constructors / factories.
- Assert thrown `DomainError` subclasses.

```ts
tripRepo = {
  findByIdForDriver: jest.fn(),
  save: jest.fn(async (t: Trip) => t),
};
useCase = new StartTripUseCase(tripRepo, presenter, /* … */);
```

Do not boot Nest for unit tests. Integration tests (`*.int-spec.ts`) are for adapters against a real DB/Redis.

---

## Add a new bounded context (checklist)

Replace `widget` / `Widget` with the real name.

1. **Create the tree** under `src/modules/widget/` as in [One feature module](#one-feature-module-canonical-tree).
2. **Model** — `domain/model/widget.model.ts` with `create`, `getId`, behavior methods.
3. **Port** — `domain/ports/widget.repository.port.ts`.
4. **Token** — `shared/tokens/port.token.ts` → `export const WIDGET_REPOSITORY = Symbol('WIDGET_REPOSITORY')`.
5. **Errors** — `domain/errors/widget.error.ts` + `ErrorCode` + `i18n/en/errors.json`.
6. **Command** — `domain/application/commands/create-widget.command.ts`.
7. **Use case** — inject the token, typed as the port; `execute(cmd)`.
8. **Entity + mapper + adapter** under `infrastructure/typeorm/`.
9. **`infrastructure.module.ts`** — `{ provide: WIDGET_REPOSITORY, useClass: TypeOrmWidgetRepositoryAdapter }`.
10. **HTTP** — DTO, mapper (`toCommand`), controller (guards + `useCase.execute`).
11. **`interfaces/widget.module.ts`** — import infra, register use cases + controller.
12. **`app.module.ts`** — `imports: [WidgetModule]`.
13. **Spec** — mock `WidgetRepositoryPort`, cover happy path and domain errors.

Skeleton for the two Nest modules:

```ts
// infrastructure/infrastructure.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([WidgetEntity])],
  providers: [
    { provide: WIDGET_REPOSITORY, useClass: TypeOrmWidgetRepositoryAdapter },
  ],
  exports: [TypeOrmModule, WIDGET_REPOSITORY],
})
export default class WidgetInfrastructureModule {}

// interfaces/widget.module.ts
@Module({
  imports: [WidgetInfrastructureModule],
  controllers: [WidgetController],
  providers: [CreateWidgetUseCase, GetWidgetUseCase],
  exports: [WidgetInfrastructureModule],
})
export default class WidgetModule {}
```

---

## Do / don’t

**Do**

- Keep one use case per application action.
- Put invariants on the domain model, orchestration in the use case.
- Return domain objects from adapters; map to HTTP only in `interfaces/`.
- Use `Symbol` tokens for every port.
- Throw `DomainError`; let `DomainExceptionFilter` render HTTP.

**Don’t**

- Inject a TypeORM `Repository<Entity>` into a use case.
- Import `*.entity.ts` from `domain/` or `interfaces/`.
- Put `class-validator` on commands or models.
- Catch domain errors in controllers to convert status codes.
- Share TypeORM entities across modules instead of use cases or events.
- Grow a “god” application service that is really five use cases.

External HTTP clients (Qonto, OSRM, …) belong in `infrastructure/<vendor>/`. Prefer a port in `domain/ports/` so use cases stay vendor-agnostic. If a use case currently injects a concrete client, treat that as debt — wrap it with a port when you touch that code.

---

## Reference modules in this repo

Copy structure from these; they match this document closely:

| Module | Why it is a good template |
|---|---|
| `patients/` | Smallest full slice: model, port, command, use case, adapter, HTTP mapper, two Nest modules. |
| `schedule/` | Rich model + many use cases + domain events. |
| `drivers/` | Auth use cases, several repositories, guards. |
| `payments/` | Extra driven adapter (`infrastructure/qonto/`) besides TypeORM. |
| `shared/` | App-wide ports (hash, JWT, S3, email) and `DomainError`. |

Start a new feature by duplicating `patients/` and renaming.
