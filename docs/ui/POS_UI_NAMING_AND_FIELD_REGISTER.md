# Rifad POS UI Naming and Field Register

Last updated: 2026-08-17

## Purpose

This is the canonical human-readable register for POS-facing labels, visible fields, durable data requirements, and known persistence gaps.

It exists so a field that appears in the interface is not forgotten when Rifad moves from the current mock/local runtime to a production database, sync layer, payment terminal, fiscal layer, or external adapter.

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

- frequent cashier targets should normally be about 48 px or more when space allows;
- short displays should retain approximately 44–48 px important targets rather than collapsing to desktop controls;
- change layout, column count, wrapping, scrolling, or secondary content before shrinking frequent controls;
- typography is judged from the cashier's real viewing distance;
- primary actions have greater visual/touch weight than secondary actions;
- frequent completion actions live in a stable footer/action band outside scrolling content whenever practical;
- dynamic validation near a keypad reserves stable geometry instead of moving repeated touch targets.

Responsive QA must cover at least large cashier displays, 1366×768-class devices, tablet landscape, short-height POS displays, and narrow/mobile layouts.

---

# 2. Canonical cashier-facing terminology

## Sales modes

| Concept | Canonical Arabic label | Notes |
| --- | --- | --- |
| Touch grid mode | **شاشة لمس** | Product/page grid optimized for touch. |
| Search/barcode-first mode | **البيع السريع** | Final cashier-facing name. Internal persisted value may remain `basic`. |

## Main sales actions

| Concept | Canonical label |
| --- | --- |
| Save current ticket | **حفظ** |
| Enter checkout | **دفع** |
| Credit sale from Quick Sale with items | **آجل** |
| Debt settlement from empty Quick Sale | **سداد** |
| Add/attach customer | **إضافة عميل إلى التذكرة** |

Do not use `سداد` as the general Sales-screen checkout label. General checkout is `دفع`; `سداد` is used for cash completion and debt-settlement contexts.

## Order types

- **محلي** → `dine-in`
- **سفري** → `takeaway`
- **توصيل** → `delivery`

## Payment methods

| Durable value | Canonical label | Current status |
| --- | --- | --- |
| `cash` | **نقدًا** | Active mock flow. |
| `card` | **شبكة / مدى** | Active UX/mock flow; not production terminal evidence. |
| `credit` | **آجل** | Customer-credit completion path. |

## Cash payment labels

- **المبلغ المستلم**
- **مبالغ سريعة**
- **الباقي للعميل**
- **سداد**

The exact total is prefilled. The separate **بالضبط** shortcut and redundant separate **مسح** action are not part of the accepted cash UI; deletion is handled by the keypad.

## Sale/debt success labels

Sale success uses **اكتملت العملية / تمت عملية البيع بنجاح**, receipt facts, **طباعة الإيصال**, and **بيع جديد** as the primary next action.

Debt-settlement success uses **تم تسجيل السداد**, **الرصيد قبل السداد**, **المبلغ المسدد**, **المتبقي على العميل / الرصيد المتبقي**, and explicit **تم** so the cashier can read the result before leaving.

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
| `abbreviation` | CURRENT | Compact product visual use. |
| `sku` | **REQUIRED-GAP** | Quick Sale promises SKU search, but Product does not contain SKU. |
| barcode identity / `barcodes[]` | **REQUIRED-GAP** | Quick Sale promises scanning/search, but current mock search matches name only. |
| `tone` | UI-ONLY | Prototype visual treatment. |

Product name and price copied onto completed receipts are historical snapshots; later product edits must not rewrite prior receipts.

---

# 4. Sale-page layout fields

Current `SalePage` model:

- `id` — CURRENT
- `name` — CURRENT
- `isDefault` — CURRENT
- `productSlots[]` — CURRENT mock representation

Normalized production persistence should eventually preserve page identity, slot index, product relation, page ordering and configuration scope explicitly rather than relying only on an opaque array.

---

# 5. Ticket fields

## Ticket

| Field | Status | Notes |
| --- | --- | --- |
| `id` | CURRENT | Stable ticket identity. |
| `sequence` | CURRENT | Cashier-visible local sequence. |
| `lines` | CURRENT | Item collection. |
| `customer` / future `customerId` | CURRENT concept | Current mock embeds reference snapshot. |
| `subtotal` | CURRENT | Money authority. |
| `loyaltyRedemption` | CURRENT | Ticket reduction. |
| `taxIncluded` | CURRENT | Included-tax value. |
| `total` | CURRENT | Final ticket total. |
| `updatedAt` | CURRENT | Ticket update time. |
| `orderType` | **REQUIRED-GAP** | Current UI choice is not durable through ticket → checkout → receipt. |
| ticket lifecycle/status | **REQUIRED-GAP** | Production Save/open-ticket semantics need explicit durable status. |
| created timestamp | **REQUIRED-GAP** | Audit/open-ticket ordering. |
| stable branch/device/employee refs | **REQUIRED-GAP** | Multi-device durable operation. |

## TicketLine

- `id`, `productId`, `name`, `unitPrice`, `quantity` — CURRENT
- line total — DERIVED (`unitPrice × quantity`), with completed-receipt snapshot
- `tone` — UI-ONLY

The current slice uses integer quantity. Future modifiers, variants, weighed quantity, UOM, discounts, notes and tax breakdown require explicit future authorization/register changes.

---

# 6. Checkout and payment fields

Current checkout concepts include `checkoutId`, `ticketId`, selected payment method and command/idempotency identity. Durable production restart requires explicit checkout status/timestamps and persisted command evidence.

A future normalized payment record should support multiple records per receipt rather than assuming a permanent single scalar payment shape. Reserve identity, ticket/checkout/receipt links, method, authoritative amount, status, command key and timestamps.

Cash-specific current receipt evidence:

- `tendered` — CURRENT
- `change` — CURRENT / derived but preserved on completed receipt

For production شبكة/مدى integration reserve legitimate provider/terminal fields such as provider/acquirer, terminal ID, external transaction/reference ID, authorization/approval reference, RRN when supplied, masked card reference only when allowed, scheme, status and provider timestamps.

Do **not** store full PAN, PIN, CVV, track data or other prohibited sensitive payment data in the Rifad application database.

---

# 7. Receipt fields

Current executable receipt includes:

- `id`, `number`, `paymentMethod`
- item snapshots: product ID, name, quantity, unit price, line total
- `subtotal`, `loyaltyRedemption`, `taxIncluded`, `total`
- `tendered`, `change`, `loyaltyEarned`
- `completedAt`
- employee name and branch name snapshots
- customer reference snapshot when attached

Required additions before production completeness:

- `orderType` — **REQUIRED-GAP**
- stable `employeeId`, `branchId`, `deviceId` — **REQUIRED-GAP**
- durable payment-record linkage — **REQUIRED-GAP** before split/multi-method payment
- fiscal/ZATCA and refund/cancellation fields when those flows are implemented

---

# 8. Customer fields

## Customer

Current executable model/persistence supports:

| Field | Status | Notes |
| --- | --- | --- |
| `id` | CURRENT | Stable customer identity. |
| `name` | CURRENT | Cashier-facing identity. |
| `mobile` | CURRENT | Primary contact/lookup identity. Create/edit UI requires exactly 10 local digits in `05XXXXXXXX` form. Runtime validation enforces the same local Saudi shape. |
| `email` | CURRENT | Optional. |
| `address` | CURRENT | Optional; now available in the quick-create fields. |
| `city` | CURRENT | Optional. |
| `region` | CURRENT | Optional. |
| `postalCode` | CURRENT | Optional. |
| `country` | CURRENT | Optional. |
| `customerCode` | CURRENT | Optional internal customer code. |
| `taxNumber` | **CURRENT** | Optional numeric customer tax identity captured for future invoice/fiscal use and preserved by the current mock persistence. Presence of this field alone does **not** mean production ZATCA invoice compliance is complete. |
| `note` | CURRENT | Optional. |
| current debt balance | CURRENT | Convenience balance; ledger remains transaction evidence. |

Production persistence should add normal customer audit timestamps. Exact production tax-number semantics/validation must be aligned with the fiscal/ZATCA contract before claiming compliant tax-invoice behavior.

## DebtLedgerEntry

Current fields:

- `id`
- `customerId`
- `kind`: `opening | credit-sale | payment`
- `direction`: `debit | credit`
- `amount`
- `createdAt`
- related `ticketSequence` when applicable

Debt-settlement preview text, keypad state, validation color and success-dialog open state are UI-ONLY. The durable facts are the payment/ledger amount and resulting balance evidence.

Future debt permissions, due dates, aging, limits, settlement payment methods and statement export remain unscoped.

---

# 9. Loyalty fields

Current contract concepts include customer ID, program mode/name/configuration, balance, qualifying purchase count, rewards, redemption quote, applied redemption and loyalty earned on receipt.

Production storage should eventually use durable loyalty transaction evidence rather than relying only on mutable balances.

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

- sale mode: `touch | basic` — visible labels **شاشة لمس / البيع السريع**
- enabled visible order types
- `printReceiptAlways`

These should migrate to a structured Rifad device-preference model when the production local database is introduced. Their scope remains device-local unless product policy explicitly changes it.

---

# 11. Printing fields

Current UI exposes delivery states `idle`, `queued`, `printed`, `failed`, and `delivery-unknown`.

Known gap: historical print-delivery state is not currently persisted per receipt.

Production print job persistence should account for print-job ID, receipt ID, printer/device ID, status, command/idempotency identity, timestamps, retry/attempt evidence and safe error/unknown-delivery evidence.

`delivery-unknown` must never trigger a blind automatic duplicate print.

---

# 12. Search/barcode gap that must not be forgotten

The current Quick Sale UI promises barcode/SKU-oriented selling, but the current mock Product model has neither SKU nor barcode identity and catalog search currently matches product name only.

> **Barcode/SKU is a documented UI-to-data gap, not a completed backend capability.**

Before production Quick Sale acceptance: add fields to the catalog contract/model, define uniqueness/scope, resolve scanner input through the contract, add exact lookup tests and preserve scanner-first focus behavior.

---

# 13. UI-only state that must NOT become database truth

Examples:

- open/closed menus and dialogs;
- hover/pressed/animation state;
- keypad freshness/pressed digits;
- currently highlighted/touched line for animation;
- temporary cash/debt numeric input before completion;
- responsive breakpoint/layout mode;
- visual product `tone` unless later promoted to a real setting;
- scroll position;
- validation/result presentation classes;
- decorative payment artwork/background opacity.

Persist only when a real recovery/product requirement explicitly demands it.

---

# 14. Current high-priority data gaps discovered from the UI

Before the POS data model can be called complete for the functionality already visible, close or explicitly defer:

1. persist `orderType` from ticket through checkout and receipt;
2. add real `sku` and barcode identity/search behind the catalog contract;
3. normalize open-ticket lifecycle for Save;
4. create durable checkout/payment records suitable for restart/idempotency and future split payments;
5. persist stable branch/device/employee IDs on completed receipts;
6. persist print-job history/status;
7. move device preferences from ad-hoc browser keys into a structured local device-preference model;
8. keep card/مدى production fields reserved but do not claim terminal integration until a real provider adapter is proven.

---

# 15. Change-control rule

When a new visible field, label, option, payment method, customer attribute, receipt fact, setting, or status is added to the POS UI:

1. update this register in the same PR;
2. mark it CURRENT / REQUIRED-GAP / RESERVED-INTEGRATION / DERIVED / UI-ONLY;
3. update the Rifad contract/model when it is durable business data;
4. update the UI Execution Manifest if screen/action behavior changes;
5. add persistence tests when a field must survive refresh/restart;
6. do not wait until database implementation to discover the field.

This register is the guardrail against “the UI had the field, but the data model forgot it.”