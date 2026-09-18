# Strategy

Playbook for interchangeable behaviors behind one port. Implement from this file when a use case must **choose at runtime** among payment methods, shipping (transmission) methods, or other vendor algorithms — without `if` / `switch` in the use case.

Architecture rules still apply: [ARCHITECTURE.md](./ARCHITECTURE.md). Money writes still need [IDEMPOTENCY.md](./IDEMPOTENCY.md). Strategy structures code. It does **not** replace unique constraints, transactions, or idempotency.

---

## Why this repo needs it

Checkout already has more than one way to pay and more than one way to ship (Figma: invoices → cart → **ارسال** → **پرداخت**).

Payment types in the wholesale UI:

| UI | Domain name |
| -- | ----------- |
| آنلاین | `ONLINE` |
| چکی | `CHEQUE` |
| کسر از حقوق | `PAYROLL` |
| اعتباری (ضمانت‌نامه بانکی LC) | `CREDIT_LC` |

Shipping types in the ارسال step:

| UI | Domain name |
| -- | ----------- |
| ارسال پیشتاز | `EXPRESS_COURIER` |
| ارسال با پست معمولی | `IRAN_POST` |

`ONLINE` will itself have more than one PSP (Zarinpal, IDPay, …). A `switch (gateway)` inside `InitiatePaymentUseCase` (or a fat `PaymentService`) collects HTTP, DTOs, errors, and verify logic for every vendor. Adding a method then edits that use case and risks the ones that already work.

**Strategy** puts each algorithm in its own class behind a shared port. The use case asks a **registry**. Adding a method is a new adapter + one line in the infrastructure module.

This is the Open/Closed rule for *selectable* behavior. Hexagonal ports already exist for “talk to the outside”. Strategy is how we bind **many** adapters to **one** port and pick one per request.

---

## Strategy vs adapter vs factory

All three appear in this codebase. Do not mix them.

| Pattern | When | Example here |
| ------- | ---- | ------------ |
| **Adapter** | One external system, translated to a port. Bound once. | `DrizzleProductRepositoryAdapter`, current `ConsoleSmsAdapter` |
| **Factory (boot)** | Env picks **one** implementation for the whole process | `FILE_STORAGE_SERVICE`: S3 if `AWS_S3_BUCKET`, else local disk |
| **Strategy (runtime)** | User, order, or config picks **which** algorithm **this** request uses | Pay with cheque vs Zarinpal; ship پیشتاز vs پست |

A payment gateway class is often **both**: Strategy (chosen among methods) and Adapter (Zarinpal HTTP → internal `PaymentResult`). In a large slice you may split `ZarinpalHttpClient` (HTTP) from `ZarinpalPaymentMethod` (maps to domain). Do not split on day one unless the HTTP client is reused.

**Do not** introduce a registry for file storage, JWT, or password hashing. Those are not user-selectable. Keep the existing factory / single adapter.

**Do not** wait for a second online PSP before using Strategy for payments. The UI already has four *methods*. Cheque is not a Zarinpal with different URLs.

---

## Where it is required

Apply when two or more implementations of the **same operation** can run, and the choice is not a single env flag.

| Family | Module | Required | Strategies (first slice) |
| ------ | ------ | -------- | ------------------------ |
| Payment **method** | `payments` | **Yes** with first checkout | `ONLINE`, `CHEQUE`, `PAYROLL`, `CREDIT_LC` |
| Payment **PSP** (inside `ONLINE`) | `payments` | **Yes** as soon as a second PSP exists; registry with one PSP is still OK | `ZARINPAL`, later `IDPAY` |
| Shipping / transmission | `shipping` (or `orders` until a carrier API exists) | **Yes** with the ارسال step | `EXPRESS_COURIER`, `IRAN_POST` |
| SMS | `shared` | Only when **routing** among providers (OTP vs marketing, or failover policy) | Today: one `SmsServicePort`. Env swap = factory, not Strategy |
| Email | `shared` | Same as SMS | One nodemailer adapter |
| File storage | `shared` | No | Boot factory already |
| Pricing / tax | catalog or orders | Only if algorithms are pluggable (retail vs wholesale rules can stay on the model) | — |

Retail vs wholesale **availability** (cheque/LC only on wholesale) is not a second strategy family. It is `registry.listAvailable({ channel, amount, sellerId })`.

Free shipping (“ارسال رایگان بالای ۲۰ میلیون”) is a **quote policy**, not a fake carrier. `EXPRESS_COURIER.quote(...)` may return `0`. Do not add a `FREE` strategy.

Carts, orders, payments, and shipping are **not wired yet**. Add the registry in the same slice as the first mutation that must choose — likely initiate payment and quote shipping — not as a standalone Nest module with no callers.

---

## Hexagonal mapping

Article names → this repo:

| Article | This repo |
| ------- | --------- |
| `PaymentGateway` interface | Port in `domain/ports/` |
| `ZarinpalGateway` / `IdpayGateway` | Adapter in `infrastructure/<vendor>/` |
| `PAYMENT_GATEWAYS` Symbol | Token in `shared/tokens/port.token.ts` |
| `PaymentGatewayRegistry` | Application service; the **only** place that maps name → port |
| `PaymentService` | Use cases (`InitiatePaymentUseCase`, `VerifyPaymentUseCase`). Do not grow a god service |
| `BadRequestException` | `DomainError` + `ErrorCode` + i18n |

```
HTTP / webhook
  → InitiatePaymentUseCase / QuoteShippingUseCase
      → PaymentMethodRegistry.get(name)     // one if
          → PaymentMethodPort.request()     // Zarinpal | Cheque | …
      → PaymentRepositoryPort.save()
```

Use cases inject **ports and the registry**, never `ZarinpalPaymentAdapter`. Controllers never choose a vendor.

Internal types use **our** words (`providerRef`, `redirectUrl`, `paidAt`). Use cases must not mention `authority`, `trackId`, or Zarinpal payload keys.

---

## Shared contract (keep it small)

Do **not** make the port the lowest common denominator of every vendor. Cheque has no PSP `verify`. LC has no `redirectUrl`. Installments belong on wholesale pricing, not on `PaymentMethodPort`.

### Payment method port

```ts
export type PaymentMethodName =
  | 'ONLINE'
  | 'CHEQUE'
  | 'PAYROLL'
  | 'CREDIT_LC';

export type InitiatePaymentInput = {
  paymentId: number;
  orderId: number;
  amount: number; // tomans, from persisted order — never from the client
  callbackUrl: string;
  description?: string;
};

export type InitiatePaymentResult =
  | { kind: 'redirect'; providerRef: string; redirectUrl: string }
  | { kind: 'manual'; providerRef: string } // cheque, payroll, LC: pending review
  | { kind: 'captured'; providerRef: string }; // e.g. wallet later

export type VerifyPaymentResult = {
  providerRef: string;
  paidAt: Date;
};

export default interface PaymentMethodPort {
  readonly name: PaymentMethodName;
  readonly psp?: string; // 'ZARINPAL' when name === 'ONLINE'

  supports(channel: 'RETAIL' | 'WHOLESALE'): boolean;

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;

  /** Only ONLINE PSPs. Others throw PaymentVerifyNotSupportedError. */
  verify?(providerRef: string, amount: number): Promise<VerifyPaymentResult>;
}
```

Optional `verify` (or a second port `OnlinePaymentGatewayPort`) is better than forcing cheque to implement a no-op. If you add `createInstallment()` to this interface, every method must lie. Don’t.

`ONLINE` strategies: one class per PSP, all with `name = 'ONLINE'` and distinct `psp`. Registry key is then `${name}:${psp}` or lookup by `psp` when method is `ONLINE`.

### Shipping method port

```ts
export type ShippingMethodName = 'EXPRESS_COURIER' | 'IRAN_POST';

export type QuoteShippingInput = {
  sellerId: number;
  addressId: number;
  items: Array<{ productId: number; quantity: number; unitPrice: number }>;
  subtotal: number;
};

export type ShippingQuote = {
  method: ShippingMethodName;
  amount: number; // 0 = free
  earliestDate: string; // ISO date
  windows: Array<{ startHour: number; endHour: number }>;
};

export default interface ShippingMethodPort {
  readonly name: ShippingMethodName;

  quote(input: QuoteShippingInput): Promise<ShippingQuote>;
  book?(orderId: number, quote: ShippingQuote): Promise<{ trackingRef?: string }>;
}
```

First slice may only implement `quote` (calendar + fee). `book` / tracking wait until a carrier API exists. Same port, second method on the adapter.

---

## Registry (single `if`)

```ts
@Injectable()
export default class PaymentMethodRegistry {
  private readonly byKey = new Map<string, PaymentMethodPort>();

  constructor(
    @Inject(PAYMENT_METHODS)
    strategies: PaymentMethodPort[],
  ) {
    for (const s of strategies) {
      const key = s.psp ? `${s.name}:${s.psp}` : s.name;
      if (this.byKey.has(key)) {
        throw new Error(`Duplicate payment method: ${key}`);
      }
      this.byKey.set(key, s);
    }
  }

  get(name: PaymentMethodName, psp?: string): PaymentMethodPort {
    const key = name === 'ONLINE' ? `ONLINE:${psp}` : name;
    const found = this.byKey.get(key);
    if (!found) {
      throw new PaymentMethodUnavailableError();
    }
    return found;
  }

  listAvailable(channel: 'RETAIL' | 'WHOLESALE'): PaymentMethodPort[] {
    return [...this.byKey.values()].filter((s) => s.supports(channel));
  }
}
```

Controllers, jobs, and webhooks **must** go through this registry (or a use case that does). No second `switch` in `VerifyPaymentUseCase`.

Disable a method with config / feature flag by **not registering** it, not by commenting out a `case`.

---

## Folder layout

Payments own vendors. Shipping owns carriers. `orders` calls use cases; it does not import Zarinpal.

```
src/modules/payments/
  domain/
    model/payment.model.ts
    model/enums/payment-method.enum.ts
    model/enums/payment-status.enum.ts
    ports/payment.repository.port.ts
    ports/payment-method.strategy.port.ts
    errors/payment-method-unavailable.error.ts
    errors/payment-gateway-unavailable.error.ts
    errors/payment-verify-not-supported.error.ts
    application/
      commands/initiate-payment.command.ts
      usecases/initiate-payment.usecase.ts
      usecases/verify-payment.usecase.ts
      services/payment-method.registry.ts
  infrastructure/
    infrastructure.module.ts
    drizzle/schema/payments.ts
    zarinpal/zarinpal.payment.adapter.ts
    cheque/cheque.payment.adapter.ts
    payroll/payroll.payment.adapter.ts
    credit-lc/credit-lc.payment.adapter.ts
  shared/tokens/port.token.ts
  interfaces/payments.module.ts
  interfaces/http/controllers/payments.controller.ts
  interfaces/http/controllers/payment-webhooks.controller.ts   # REST, not tRPC

src/modules/shipping/
  domain/ports/shipping-method.strategy.port.ts
  domain/application/services/shipping-method.registry.ts
  domain/application/usecases/quote-shipping.usecase.ts
  infrastructure/express-courier/express-courier.shipping.adapter.ts
  infrastructure/iran-post/iran-post.shipping.adapter.ts
```

Tokens:

```ts
export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
export const PAYMENT_METHODS = Symbol('PAYMENT_METHODS');
export const SHIPPING_METHODS = Symbol('SHIPPING_METHODS');
```

Infrastructure module (article pattern, default-export classes):

```ts
{
  provide: PAYMENT_METHODS,
  inject: [
    ZarinpalPaymentAdapter,
    ChequePaymentAdapter,
    PayrollPaymentAdapter,
    CreditLcPaymentAdapter,
  ],
  useFactory: (...methods: PaymentMethodPort[]) => methods,
}
```

Export **use cases** from `PaymentsModule`, not the Zarinpal class. Other modules (`orders`) call `InitiatePaymentUseCase`.

---

## Use case rules

```ts
async execute(cmd: InitiatePaymentCommand) {
  const order = await this.orders.getPayable(cmd.orderId, cmd.userId);
  const method = this.methods.get(cmd.method, cmd.psp);

  const payment = Payment.createPending({
    orderId: order.getId(),
    amount: order.payableAmount(), // server amount
    method: cmd.method,
    psp: cmd.psp,
  });
  const saved = await this.payments.save(payment);

  const initiated = await method.initiate({
    paymentId: saved.getId()!,
    orderId: order.getId()!,
    amount: saved.amount,
    callbackUrl: cmd.callbackUrl,
  });

  saved.applyInitiation(initiated);
  await this.payments.save(saved);
  return initiated;
}
```

| Rule | Why |
| ---- | --- |
| Amount / status from Postgres | Client `amount` is not trusted (skill: backend owns prices) |
| Persist `pending` **before** calling the PSP | Timeout after redirect still has a row to verify |
| Do not hold a DB transaction across HTTP to Zarinpal | Connection pool + locks; see [IDEMPOTENCY.md](./IDEMPOTENCY.md) |
| Verify loads the payment, then `registry.get(payment.method, payment.psp)` | Same strategy as initiate |
| If `status === PAID`, return it | Verify is naturally retryable; unique on `provider_ref` |
| Map vendor failures to `PaymentGatewayUnavailableError` | Do not leak Zarinpal JSON to the client |
| No silent fallback to another PSP | Duplicate or ambiguous charges. Fallback is an explicit product flow |

Retry of `initiate` against a PSP is **unsafe** unless that API is idempotent or we can look up the previous `providerRef`. Client retries use `Idempotency-Key` ([IDEMPOTENCY.md](./IDEMPOTENCY.md)). Unique `(provider_ref)` on `payments` (and refunds).

Webhooks: REST adapter maps the body → `VerifyPaymentCommand`. Signature check stays in the webhook controller or a small HTTP guard, not in the domain model.

---

## Shipping (transmission) flow

ارسال step: address + method + date/window + note. Backend:

1. `QuoteShippingUseCase` — registry `get(method).quote(...)` using **server** basket totals.
2. Persist chosen method, fee, slot on the order (or a shipping record).
3. `book` later if a carrier API exists.

Do not compute shipping fee in Next.js. Do not put Tipax request bodies in `PlaceOrderUseCase`.

Retail may only expose one method at first; still call the registry so wholesale’s second method does not fork the use case.

---

## Errors, timeout, logging

| Topic | Rule |
| ----- | ---- |
| HTTP timeout | Set per PSP client. Do not hang Nest |
| External errors | Strategy → `DomainError` (`PAYMENT_GATEWAY_UNAVAILABLE`, `PAYMENT_METHOD_UNAVAILABLE`, `SHIPPING_METHOD_UNAVAILABLE`) |
| Secrets | Merchant id / API key in env. Never log tokens, card data, or full webhook bodies |
| i18n | Every new `ErrorCode` in `en` + `fa` `errors.json` |

---

## Tests

1. **Unit per strategy** — mock HTTP; assert mapping to `InitiatePaymentResult` / `ShippingQuote`.
2. **Contract test** (shared suite over `PaymentMethodPort[]`) — `initiate` shape, timeout/error mapping, `supports(channel)`. Every new adapter must pass it. Unit tests of Zarinpal alone do not prove cheque still matches the port.
3. **Use case** — mock the **registry** (or port list), not Nest. Unknown method → `PaymentMethodUnavailableError`. Amount taken from order mock, not command.
4. **Integration** (when a PSP sandbox exists) — optional; do not call production Zarinpal from CI.

---

## Mistakes we will not ship

| Mistake | What to do instead |
| ------- | ------------------ |
| `switch (gateway)` in the use case / controller / job | Registry only |
| Zarinpal response type imported in `InitiatePaymentUseCase` | Map inside the adapter |
| Fat `PaymentMethodPort` with `verify` + `refund` + `installment` + `lcDocuments` | Optional methods or a second port for ONLINE |
| Silent failover Zarinpal → IDPay | Explicit user or ops action |
| Client-sent amount on verify | Load payment row |
| Registry in `shared/` used by unrelated modules | Registry lives in `payments` / `shipping` |
| Strategy for a single env-bound adapter | Factory (files) or one port binding (SMS today) |
| Treating Strategy as a substitute for idempotency | Unique `provider_ref` + [IDEMPOTENCY.md](./IDEMPOTENCY.md) |

---

## Implementation checklist

Copy into the first checkout / payment / ارسال slice.

```
- [ ] 1. Requirement — which methods per RETAIL vs WHOLESALE; PSP list; shipping methods
- [ ] 2. Module — payments for money, shipping (or orders) for transmission
- [ ] 3. Domain — Payment / ShippingQuote; enums; small ports; DomainError
- [ ] 4. Use case — Initiate / Verify / Quote; amount from aggregate
- [ ] 5. Port + token — PAYMENT_METHODS / SHIPPING_METHODS multi-bind
- [ ] 6. Adapter — one class per method/PSP/carrier under infrastructure/<vendor>/
- [ ] 7. API — HTTP DTO has method name only; webhooks REST; never vendor DTOs
- [ ] 8. Tests — unit adapters + contract suite + use case with mock registry
- [ ] 9. Review — no switch in use case; no silent fallback; unique provider_ref; idempotency on initiate
```

---

## When a second PSP or carrier is added

1. New adapter implementing the existing port.
2. Register it in `PAYMENT_METHODS` / `SHIPPING_METHODS`.
3. Run the contract test.
4. Do not change `InitiatePaymentUseCase` / `QuoteShippingUseCase` except if the **result union** needs a new `kind`.

If product later shares this module across apps, a Nest dynamic `forRoot({ methods: [...] })` is allowed. Do not add that until a second app exists.

---

## Companion docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — folders, ports, two Nest modules per feature
- [IDEMPOTENCY.md](./IDEMPOTENCY.md) — required on initiate charge, refund, webhook inbox
- [FRONTEND.md](./FRONTEND.md) — when routes ship, document `method` / `psp` enums and shipping method names; UI labels stay in Next.js
