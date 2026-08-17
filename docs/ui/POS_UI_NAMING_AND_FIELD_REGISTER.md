# Rifad POS UI Naming and Field Register

Last updated: 2026-08-17

## Purpose

This is the canonical human-readable register for POS-facing labels, visible fields, durable data requirements, and known persistence gaps.

It exists for one practical reason: a field that appears in the interface must not be forgotten later when Rifad moves from the current mock/local runtime to a production database, sync layer, payment terminal, fiscal layer, or external adapter.

This document is **not a frozen SQL schema**. It is a traceability register between UI intent and Rifad-owned domain data.

Use it together with:

- `UI_EXECUTION_MANIFEST.json` for screen/action/flow identity and implementation gating;
- `DESIGN_AUTHORITY.md` for interaction and visual authority;
- `UI_PROGRESS.md` for current implementation status;
- `apps/pos/src/domain/models.ts` and Rifad contracts for the current executable model.

## Status legend

- **CURRENT** — exists in the executable Rifad model/contract now.
- **REQUIRED-GAP** — the UI already requires or strongly implies this data, but it is not yet durable in the current model.
- **RESERVED-INTEGRATION** — not required for the current mock, but must be accounted for before the named production integration is claimed.
- **DERIVED** — calculated from authoritative fields; should not become independent mutable truth without a deliberate reason.
- **UI-ONLY** — presentation state; should not become a database column merely because it appears in the component.

---

# 1. Human interaction authority

Rifad POS uses this design priority:

> **Touch first, then human visual clarity, then beauty.**

Consequences:

- frequent cashier targets should normally be at least about 48 px high/wide when space allows;
- on short displays, important targets should stay around 44–48 px rather than being compressed into desktop-sized controls;
- when space becomes tight, change layout, column count, wrapping, scrolling, or secondary content **before** shrinking frequent controls;
- typography is judged from the cashier's real viewing distance, not from mathematically tidy desktop proportions;
- whitespace is acceptable when it improves scanning and reachability, but important information must not look like a small island inside a large unused touch surface;
- product density must never be increased at the cost of reliable finger targeting;
- primary actions must have greater visual/touch weight than secondary actions.

Responsive QA must cover at least:

1. large cashier/desktop POS displays;
2. 1366×768-class devices;
3. tablet landscape;
4. short-height POS displays;
5. narrow/mobile layouts.

---

# 2. Canonical cashier-facing terminology

These labels are the current Rifad wording. Future code, tests, screenshots, translations, and database-facing configuration names should not invent competing labels silently.

## Sales modes

| Concept | Canonical Arabic label | Notes |
| --- | --- | --- |
| Touch grid mode | **شاشة لمس** | Product/page grid optimized for touch. |
| Search/barcode-first mode | **البيع السريع** | Final cashier-facing name. Older code/docs may still contain **شاشة أساسية** and must be normalized before visual lock. |

## Main sales actions

| Concept | Canonical label |
| --- | --- |
| Save current ticket | **حفظ** |
| Enter checkout | **دفع** |
| Credit sale from Quick Sale with items | **آجل** |
| Debt settlement from empty Quick Sale | **سداد** |
| Add/attach customer | **إضافة عميل إلى التذكرة** |

Do not use `سداد` as the general Sales-screen checkout label. General checkout is `دفع`; `سداد` is used for the cash completion action and debt-settlement context.

## Order types

Canonical visible values:

- **محلي** → `dine-in`
- **سفري** → `takeaway`
- **توصيل** → `delivery`

## Payment methods

| Durable value | Canonical label | Current status |
| --- | --- | --- |
| `cash` | **نقدًا** | Active mock flow. |
| `card` | **شبكة / مدى** | Active UX/mock flow. It is **not** evidence of a production terminal integration. |
| `credit` | **آجل** | Customer-credit completion path. |

The payment-selection screen must not label `شبكة / مدى` as `قريبًا` or `غير متاح` while the current UX mock is enabled.

## Cash payment labels

- **المبلغ المستلم**
- **مبالغ سريعة**
- **الباقي للعميل**
- **مسح**
- **سداد**

The exact total is already prefilled. A separate visible shortcut named **بالضبط** is unnecessary in the accepted interaction direction.

## Sale success labels

- **اكتملت العملية**
- **تمت عملية البيع بنجاح**
- **محفوظ محليًا**
- **رقم الإيصال**
- **الإجمالي**
- cash: **المستلم**, **الباقي**
- card: **طريقة الدفع**, **شبكة / مدى**
- **طباعة** / accessible name **طباعة الإيصال**
- **بيع جديد** — primary next action
- **طباعة الإيصال دائمًا في العمليات القادمة**

---

# 3. Product / catalog fields

## Product

| Field | Status | UI/data reason |
| --- | --- | --- |
| `id` | CURRENT | Stable product identity. |
| `name` | CURRENT | Product tile, ticket line, search result. |
| `categoryId` | CURRENT | Catalog grouping/filtering. |
| `categoryName` | CURRENT | Current catalog metadata. |
| `price` (`Money`) | CURRENT | Unit price authority. |
| `abbreviation` | CURRENT | Compact visual/product swatch use. |
| `sku` | **REQUIRED-GAP** | Quick Sale explicitly promises SKU search, but the current Product model does not contain SKU. |
| `barcodes[]` or equivalent barcode identity | **REQUIRED-GAP** | Quick Sale explicitly promises barcode scanning/search, but current mock search only matches name. Do not claim production barcode support until this exists through the contract. |
| `tone` | UI-ONLY | Current prototype color treatment. Do not treat it as required business data unless a future product-color feature explicitly adopts it. |

### Production rule

Product name and unit price copied onto a completed receipt are historical snapshots. A future product rename or price change must not rewrite prior receipts.

---

# 4. Sale-page layout fields

## SalePage

Current UI model:

- `id` — CURRENT
- `name` — CURRENT
- `isDefault` — CURRENT
- `productSlots[]` — CURRENT mock representation

Production persistence should preserve slot identity explicitly rather than depending on an opaque array alone. Minimum durable relationship:

- `pageId` — REQUIRED-GAP for normalized persistence
- `slotIndex` — REQUIRED-GAP for normalized persistence
- `productId` — REQUIRED-GAP for normalized persistence
- page ordering/position — REQUIRED-GAP because rename/reorder/delete already exist in the executable UI
- configuration scope (`device` / branch / store / business, once product policy is fixed) — REQUIRED-GAP before cloud sync

---

# 5. Ticket fields

## Ticket

| Field | Status | Notes |
| --- | --- | --- |
| `id` | CURRENT | Stable ticket identity. |
| `sequence` | CURRENT | Cashier-visible local sequence. |
| `lines` | CURRENT | Current item collection. |
| `customer` / future durable `customerId` | CURRENT concept | Current mock embeds a customer reference snapshot. Production schema should use identity plus required snapshots where needed. |
| `subtotal` | CURRENT | Money authority. |
| `loyaltyRedemption` | CURRENT | Real ticket reduction. |
| `taxIncluded` | CURRENT | Current included-tax value. |
| `total` | CURRENT | Final ticket total. |
| `updatedAt` | CURRENT | Ticket update time. |
| `orderType` | **REQUIRED-GAP** | UI already supports Local/Takeaway/Delivery, but selection is currently component-local and is lost across durable ticket → checkout → receipt. This is a high-priority gap. |
| ticket lifecycle/status | **REQUIRED-GAP** | `حفظ` exists. Production open-ticket persistence needs explicit open/saved/completed/cancelled semantics rather than an in-memory list. |
| created timestamp | **REQUIRED-GAP** | Needed for durable audit/open-ticket ordering. |
| branch/device/employee ownership references | **REQUIRED-GAP** | Required when moving from one local mock to multi-device durable operation. |

## TicketLine

| Field | Status | Notes |
| --- | --- | --- |
| `id` | CURRENT | Stable line identity. |
| `productId` | CURRENT | Product reference. |
| `name` | CURRENT snapshot | Must remain historical on receipt. |
| `unitPrice` | CURRENT snapshot | Must remain historical on receipt. |
| `quantity` | CURRENT | Integer quantity in current slice. |
| line total | DERIVED | `unitPrice × quantity`; receipt currently persists the computed snapshot. |
| `tone` | UI-ONLY | Visual prototype data, not required accounting truth. |

Future modifiers, notes, variants, open-price reasons, discounts, tax breakdowns, unit-of-measure, and weighed quantities remain outside the currently accepted slice and must be added to this register when their UI is authorized.

---

# 6. Checkout and payment fields

## Checkout session

The current mock checkout is partly ephemeral. Before local-first production checkout/restart can be claimed, preserve at minimum:

- `checkoutId` — CURRENT concept
- `ticketId` — CURRENT concept
- `selectedPaymentMethod` — CURRENT concept
- checkout status — **REQUIRED-GAP**
- created/updated timestamps — **REQUIRED-GAP**
- idempotency/command identity for durable completion — CURRENT contract requirement, **REQUIRED-GAP** for production persistence

## Payment record

A production model should support one or more payment records rather than assuming every receipt has only one permanent payment shape. This prevents future split payment from forcing a receipt-schema rewrite.

Minimum common fields to reserve:

- payment `id` — RESERVED-INTEGRATION
- `checkoutId` / `ticketId` / `receiptId` linkage — RESERVED-INTEGRATION
- `method` (`cash`, `card`, `credit`, later approved methods) — CURRENT concept
- authoritative `amount` — RESERVED-INTEGRATION
- payment `status` — RESERVED-INTEGRATION
- `commandId` / idempotency key — RESERVED-INTEGRATION
- `createdAt`, `completedAt` — RESERVED-INTEGRATION

### Cash-specific

- `tendered` — CURRENT on Receipt
- `change` — CURRENT on Receipt / DERIVED from tendered-total but preserved as completed-sale evidence

### Card / شبكة / مدى production integration

The current flow is a **mock UX contract**, not a connected payment-terminal claim. Before production terminal support, reserve/validate fields such as:

- `provider` / acquirer adapter — RESERVED-INTEGRATION
- `terminalId` — RESERVED-INTEGRATION
- external transaction/reference ID — RESERVED-INTEGRATION
- authorization/approval code where supplied — RESERVED-INTEGRATION
- RRN/reference where supplied — RESERVED-INTEGRATION
- masked PAN only when legitimately supplied and allowed — RESERVED-INTEGRATION
- card/network scheme (`mada`, etc.) when supplied — RESERVED-INTEGRATION
- terminal result/status — RESERVED-INTEGRATION
- provider response time/completed time — RESERVED-INTEGRATION

Do **not** store full PAN, PIN, CVV, track data, or other prohibited sensitive payment data in the Rifad application database.

Exact provider field names remain adapter-specific; the Rifad payment contract should normalize only what Rifad legitimately needs for audit, receipt display, reconciliation, refund, and support.

---

# 7. Receipt fields

## Receipt

Current executable fields:

- `id`
- `number`
- `paymentMethod`: `cash | card | credit`
- item snapshots: product ID, name, quantity, unit price, line total
- `subtotal`
- `loyaltyRedemption`
- `taxIncluded`
- `total`
- `tendered`
- `change`
- `loyaltyEarned`
- `completedAt`
- employee name snapshot
- branch name snapshot
- customer reference snapshot when attached

Required additions before durable production completeness:

- `orderType` — **REQUIRED-GAP**
- stable `employeeId`, `branchId`, `deviceId` in addition to human-readable snapshots — **REQUIRED-GAP**
- durable payment-record linkage — **REQUIRED-GAP** before split/multi-method payment
- fiscal/ZATCA identity/status fields — outside the current UI slice; must be added when the fiscal contract is implemented
- cancellation/refund relationship fields — outside current slice; add when refund flow is authorized

---

# 8. Customer fields

## Customer

Current model:

- `id`
- `name`
- `mobile` — current primary unique contact identity
- `email`
- `address`
- `city`
- `region`
- `postalCode`
- `country`
- `customerCode`
- `note`
- current debt balance

Production persistence should also add normal audit metadata (`createdAt`, `updatedAt`) and avoid treating the mutable debt balance as the only debt evidence. The ledger is the transaction history authority.

## DebtLedgerEntry

Current fields:

- `id`
- `customerId`
- `kind`: `opening | credit-sale | payment`
- `direction`: `debit | credit`
- `amount`
- `createdAt`
- related `ticketSequence` when applicable

Future debt permissions, due dates, aging, limits, and settlement payment methods remain unscoped and must not be invented silently.

---

# 9. Loyalty fields

Current contract concepts:

- customer ID
- program enabled/mode/name
- cashback earn percent where applicable
- purchase-count requirement and reward label where applicable
- balance
- qualifying purchase count
- rewards available
- redemption quote amount
- balance after redemption
- loyalty earned on completed receipt

Before production persistence, program identity/version and a loyalty transaction ledger should be considered instead of relying only on a mutable balance. Exact schema is not frozen in this UI phase.

---

# 10. Device, employee and POS preferences

## DeviceSession — CURRENT

- `deviceId`
- `deviceName`
- `branchId`
- `branchName`
- `linkedEmail`

## EmployeeSession — CURRENT

- `employeeId`
- `employeeName`
- `roleName`

## Device-local UI preferences

The following are real product settings even though the current prototype stores them in browser localStorage:

- sale mode: `touch | basic` — visible labels **شاشة لمس / البيع السريع**
- enabled visible order types
- `printReceiptAlways`

These should migrate to a structured Rifad device-preference model when the production local database is introduced. Their scope must remain device-local unless product policy explicitly changes it.

---

# 11. Printing fields

Current UI exposes delivery states:

- `idle`
- `queued`
- `printed`
- `failed`
- `delivery-unknown`

Known gap: historical print-delivery state is not currently persisted per receipt.

Production print job persistence should account for:

- print job ID
- receipt ID
- printer/device ID
- status
- command/idempotency identity
- created/submitted/completed timestamps
- retry count or separate attempts where needed
- error/unknown-delivery evidence safe for support

`delivery-unknown` must never trigger a blind automatic duplicate print.

---

# 12. Search/barcode gap that must not be forgotten

The current Quick Sale placeholder says the cashier can scan a barcode or search by product name/SKU. The current mock Product model has neither `sku` nor barcode identity, and the mock catalog search currently matches product name only.

Therefore:

> **Barcode/SKU is a documented UI-to-data gap, not a completed backend capability.**

Before production Quick Sale acceptance:

1. add SKU/barcode fields to the Rifad catalog contract/model;
2. define uniqueness/scope rules;
3. make scanner input resolve through the catalog contract;
4. add behavior tests for exact barcode and SKU lookup;
5. preserve keyboard focus behavior already implemented for scanner-first operation.

---

# 13. UI-only state that must NOT become database truth

Examples:

- open/closed menus and dialogs;
- hover/pressed/animation state;
- `keypadFresh`;
- currently highlighted/touched line for animation;
- temporary cash input before payment completion;
- responsive breakpoint/layout mode;
- visual product `tone` unless later promoted to a real product-display setting;
- scroll position;
- disabled/hover CSS state;
- decorative payment artwork/background opacity.

Persist only when a real recovery/product requirement explicitly demands it.

---

# 14. Current high-priority data gaps discovered from the UI

Before the POS data model can be called complete for the functionality already visible, close or explicitly defer these items:

1. **Persist `orderType`** from ticket through checkout and receipt.
2. **Add real `sku` and barcode identity/search** behind the catalog contract.
3. **Normalize open-ticket lifecycle** for the existing Save action.
4. **Create durable checkout/payment records** suitable for restart/idempotency and future split payments.
5. **Persist stable branch/device/employee IDs on completed receipts**, not names alone.
6. **Persist print job history/status** rather than only transient UI state.
7. **Move device preferences from ad-hoc browser keys into a structured local device-preference model** when the local database is introduced.
8. **Keep card/مدى production fields reserved but do not claim terminal integration until a real provider adapter is proven.**

---

# 15. Change-control rule

When a new visible field, label, option, payment method, customer attribute, receipt fact, setting, or status is added to the POS UI:

1. update this register in the same PR;
2. mark the field CURRENT / REQUIRED-GAP / RESERVED-INTEGRATION / DERIVED / UI-ONLY;
3. update the Rifad contract/model if it is durable business data;
4. update the UI Execution Manifest if screen/action behavior changes;
5. add persistence tests when a field must survive refresh/restart;
6. do not wait until database implementation to discover the field.

This register is the guardrail against “the UI had the field, but the data model forgot it.”
