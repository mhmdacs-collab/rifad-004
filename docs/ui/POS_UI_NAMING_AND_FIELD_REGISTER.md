# Rifad POS UI Naming and Field Register

Last updated: 2026-08-17

## Purpose

This is the canonical human-readable register for POS-facing labels, visible fields, durable data requirements, and known persistence gaps.

It exists so a field that appears in the interface or becomes an approved product requirement is not forgotten when Rifad moves from the current mock/local runtime to a production database, sync layer, payment terminal, fiscal layer, kitchen layer, sales-channel integration or external adapter.

This document is **not a frozen SQL schema**. It is a traceability register between UI intent and Rifad-owned domain data.

Use it together with:

- `UI_EXECUTION_MANIFEST.json` for screen/action/flow identity and implementation gating;
- `DESIGN_AUTHORITY.md` for interaction and visual authority;
- `UI_PROGRESS.md` for current implementation status;
- `apps/pos/src/domain/models.ts` and Rifad contracts for the current executable model;
- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md` for current restaurant market evidence.

## Status legend

- **CURRENT** — exists in the executable Rifad model/contract now.
- **REQUIRED-GAP** — approved/required product data that is not yet durable in the current model.
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
- primary actions have greater visual/touch weight than inactive/secondary actions;
- frequent completion actions live in a stable footer/action band outside scrolling content whenever practical;
- dynamic validation near a keypad reserves stable geometry instead of moving repeated touch targets;
- transaction action slots stay physically stable even when state-appropriate visual priority changes.

Responsive QA must cover at least large cashier displays, 1366×768-class devices, tablet landscape, short-height POS displays, and narrow/mobile layouts.

---

# 2. Canonical cashier-facing terminology

## Sales modes

| Concept | Canonical Arabic label | Notes |
| --- | --- | --- |
| Touch grid mode | **شاشة لمس** | Product/page grid optimized for touch. |
| Search/barcode-first mode | **البيع السريع** | Final cashier-facing name. Internal persisted value may remain `basic`. |

## Main sales actions

| Concept | Canonical label | Status / meaning |
| --- | --- | --- |
| Enter checkout | **دفع** | Current and target general checkout action. |
| Prototype generic save | **حفظ** | Current prototype only; not target restaurant semantics when table service is enabled. |
| Assign basket to local service place | **محلي** | REQUIRED product direction; replaces generic Save in table-service mode. |
| Resume local open orders | **طلبات مفتوحة** | REQUIRED product direction; optional count may be displayed as `طلبات مفتوحة · N`. |
| Credit sale from Quick Sale with items | **آجل** | Current customer-credit path. |
| Debt settlement from empty Quick Sale | **سداد** | Current debt-book entry. |
| Add/attach customer | **إضافة عميل إلى التذكرة** | Current. |
| Clear all basket lines | **مسح السلة** | Current; visible copy intentionally contains no explanatory subtitle/badge. |

Do not use `سداد` as the general Sales-screen checkout label. General checkout is `دفع`; `سداد` is used for cash completion and debt-settlement contexts.

## Kitchen fulfillment / service mode

The target durable concept is `fulfillmentMode`, not an overloaded payment/order-source field.

| Durable value | Canonical Arabic | Meaning |
| --- | --- | --- |
| `takeaway` | **سفري** | Default operational mode for direct POS sale unless another context is set. |
| `dine_in` | **محلي** | Order assigned to a restaurant service place/open local order. |
| `delivery` | **توصيل** | Delivery fulfillment, normally established by a delivery-channel/order workflow. |

The current prototype's visible **محلي / سفري / توصيل** selector is UI-local staging behavior and is **not** the target interaction model. Do not create a permanent production `orderType` schema merely because the temporary selector exists.

## Sales channel

Target durable concept: `salesChannelId` / channel identity.

Examples:

- direct POS;
- Keeta;
- HungerStation;
- Ninja;
- future online/marketplace channel.

Channel identity is separate from fulfillment and payment/settlement even when the UI combines defaults into one tap.

## Payment methods / settlement

| Durable value/concept | Canonical label | Current status |
| --- | --- | --- |
| `cash` | **نقدًا** | Active mock flow. |
| `card` | **شبكة / مدى** | Active UX/mock flow; not production terminal evidence. |
| `credit` | **آجل** | Customer-credit completion path. |
| platform settlement | platform/channel-specific label | REQUIRED/RESERVED depending on integration; must not be the only place channel identity is stored. |

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

# 3. Product / catalog / pricing fields

## Product

| Field | Status | UI/data reason |
| --- | --- | --- |
| `id` | CURRENT | Stable product identity. |
| `name` | CURRENT | Product tile, ticket line, search result. |
| `categoryId` | CURRENT | Catalog grouping/filtering. |
| `categoryName` | CURRENT | Current catalog metadata. |
| base `price` (`Money`) | CURRENT | Current unit-price authority. |
| `abbreviation` | CURRENT | Compact product visual use. |
| `sku` | **REQUIRED-GAP** | Quick Sale promises SKU search, but Product does not contain SKU. |
| barcode identity / `barcodes[]` | **REQUIRED-GAP** | Quick Sale promises scanning/search, but current mock search matches name only. |
| channel price list / product channel override | **REQUIRED-GAP** | Delivery/platform channels may require a different customer-facing price than direct POS. |
| `tone` | UI-ONLY | Prototype visual treatment. |

Product name and effective price copied onto completed receipts are historical snapshots; later product/pricelist edits must not rewrite prior receipts.

## Channel pricing model direction

Production should prefer a normalized price context such as pricelist/channel-price records rather than hard-coded columns like `keetaPrice`, `hungerStationPrice` on every product.

Required concepts:

- base price;
- sales channel / pricelist identity;
- optional product override;
- resolved/effective price;
- effective price snapshot on ticket/receipt;
- effective-from/versioning rules when pricing history matters.

Platform commission/settlement fee is not the same field as product selling price and must be accounted for separately.

---

# 4. Sale-page layout fields

Current `SalePage` model:

- `id` — CURRENT
- `name` — CURRENT
- `isDefault` — CURRENT
- `productSlots[]` — CURRENT mock representation

Normalized production persistence should eventually preserve page identity, slot index, product relation, page ordering and configuration scope explicitly rather than relying only on an opaque array.

---

# 5. Ticket / open-order fields

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
| `fulfillmentMode` | **REQUIRED-GAP** | Target durable kitchen/service meaning: takeaway/dine-in/delivery. |
| `salesChannelId` | **REQUIRED-GAP** | Direct POS vs delivery/online channel. |
| `priceContextId` / pricelist snapshot | **REQUIRED-GAP** | Needed when channel selection changes effective product prices. |
| `serviceAreaId` | **REQUIRED-GAP** | Required for local service when assigned to an area. |
| `servicePlaceId` | **REQUIRED-GAP** | Table/room/session/place identity for local open order. |
| open-order lifecycle/status | **REQUIRED-GAP** | Draft/working/open/paid/cancelled/other finalized states require deliberate contract design. |
| created timestamp | **REQUIRED-GAP** | Audit/open-order ordering and elapsed-time display. |
| stable branch/device/employee refs | **REQUIRED-GAP** | Multi-device durable operation. |
| kitchen dispatch revision / sent quantity evidence | **REQUIRED-GAP** | Required to send additions/voids as deltas and avoid duplicate preparation work. |

The old prototype `orderType` selector should not become a permanent durable field. Migrate the intended meaning to `fulfillmentMode` when the restaurant flow is implemented.

## TicketLine

- `id`, `productId`, `name`, `unitPrice`, `quantity` — CURRENT
- line total — DERIVED (`unitPrice × quantity`), with completed-receipt snapshot
- effective price source/channel context — **REQUIRED-GAP** for channel pricing traceability
- kitchen sent quantity/revision relation — **REQUIRED-GAP** when preparation deltas are implemented
- `tone` — UI-ONLY

The current slice uses integer quantity. Future modifiers, variants, weighed quantity, UOM, discounts, notes and tax breakdown require explicit future authorization/register changes.

---

# 6. Restaurant service-area/place fields

Target table/local-service model:

## POS/branch configuration

| Field | Status | Meaning |
| --- | --- | --- |
| `tableServiceEnabled` | **REQUIRED-GAP** | Enables/disables local/service-place workflow for the POS/branch/configuration. |

## ServiceArea

- `id` — REQUIRED-GAP
- `name` — REQUIRED-GAP
- branch/POS scope — REQUIRED-GAP
- display order — REQUIRED-GAP
- active flag — REQUIRED-GAP
- optional layout/background metadata — future, not required for first functional proof

Examples: الصالة، الدور الأول، الغرف، الجلسات الخارجية.

## ServicePlace

- `id` — REQUIRED-GAP
- `serviceAreaId` — REQUIRED-GAP
- cashier-facing name/code — REQUIRED-GAP
- active flag — REQUIRED-GAP
- optional capacity/seats — future/required when guest-count/split-by-seat scope is approved
- optional x/y/size/shape — future Back Office layout data, not required to prove open-order semantics

Examples: طاولة 12، غرفة 3، جلسة 8.

Open/occupied color, card selection, current area tab, hover/pressed state and responsive list-vs-map mode are UI-ONLY.

---

# 7. Checkout, sales channel and payment fields

Current checkout concepts include `checkoutId`, `ticketId`, selected payment method and command/idempotency identity. Durable production restart requires explicit checkout status/timestamps and persisted command evidence.

A future normalized payment record should support multiple records per receipt rather than assuming a permanent single scalar payment shape. Reserve identity, ticket/checkout/receipt links, method, authoritative amount, status, command key and timestamps.

Channel identity is **not** inferred solely from payment record.

A delivery-channel adapter may provide/order facts such as:

- external order ID/reference;
- channel store/location ID;
- settlement status/reference;
- channel timestamps;
- channel fee/commission evidence;
- external customer/address details when within approved privacy scope.

These are **RESERVED-INTEGRATION** until an actual channel integration is authorized.

Cash-specific current receipt evidence:

- `tendered` — CURRENT
- `change` — CURRENT / derived but preserved on completed receipt

For production شبكة/مدى integration reserve legitimate provider/terminal fields such as provider/acquirer, terminal ID, external transaction/reference ID, authorization/approval reference, RRN when supplied, masked card reference only when allowed, scheme, status and provider timestamps.

Do **not** store full PAN, PIN, CVV, track data or other prohibited sensitive payment data in the Rifad application database.

---

# 8. Receipt fields

Current executable receipt includes:

- `id`, `number`, `paymentMethod`
- item snapshots: product ID, name, quantity, unit price, line total
- `subtotal`, `loyaltyRedemption`, `taxIncluded`, `total`
- `tendered`, `change`, `loyaltyEarned`
- `completedAt`
- employee name and branch name snapshots
- customer reference snapshot when attached

Required additions before restaurant/channel production completeness:

- `fulfillmentMode` — **REQUIRED-GAP**
- `salesChannelId` / safe channel snapshot — **REQUIRED-GAP**
- service area/place snapshot or durable relation when local — **REQUIRED-GAP**
- price-context/pricelist evidence where channel pricing applies — **REQUIRED-GAP**
- stable `employeeId`, `branchId`, `deviceId` — **REQUIRED-GAP**
- durable payment-record linkage — **REQUIRED-GAP** before split/multi-method payment
- fiscal/ZATCA and refund/cancellation fields when those flows are implemented

---

# 9. Customer fields

## Customer

Current executable model/persistence supports:

| Field | Status | Notes |
| --- | --- | --- |
| `id` | CURRENT | Stable customer identity. |
| `name` | CURRENT | Cashier-facing identity. |
| `mobile` | CURRENT | Primary contact/lookup identity. Create/edit UI requires exactly 10 local digits in `05XXXXXXXX` form. Runtime validation enforces the same local Saudi shape. |
| `email` | CURRENT | Optional. |
| `address` | CURRENT | Optional; available in the quick-create fields. |
| `city` | CURRENT | Optional. |
| `region` | CURRENT | Optional. |
| `postalCode` | CURRENT | Optional. |
| `country` | CURRENT | Optional. |
| `customerCode` | CURRENT | Optional internal customer code. |
| `taxNumber` | **CURRENT** | Optional numeric customer tax identity captured for future invoice/fiscal use and preserved by current mock persistence. Presence does not mean production ZATCA invoice compliance is complete. |
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

# 10. Loyalty fields

Current contract concepts include customer ID, program mode/name/configuration, balance, qualifying purchase count, rewards, redemption quote, applied redemption and loyalty earned on receipt.

Production storage should eventually use durable loyalty transaction evidence rather than relying only on mutable balances.

---

# 11. Device, employee and POS preferences/configuration

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

## Current device-local UI preferences

- sale mode: `touch | basic` — visible labels **شاشة لمس / البيع السريع**
- enabled visible order types — current prototype staging preference; target restaurant interaction is superseding this generic selector
- `printReceiptAlways`

## Required restaurant/POS configuration

- `tableServiceEnabled` — REQUIRED-GAP
- available service areas/places — REQUIRED-GAP
- allowed sales channels — REQUIRED-GAP when channel UI is authorized
- default/direct sales channel — REQUIRED-GAP when channel domain is introduced
- channel pricing/pricelist mapping — REQUIRED-GAP

These settings may temporarily be exposed in POS during UI-first development, but persistent business configuration should migrate to structured Rifad configuration and Back Office ownership where appropriate.

---

# 12. Printing and kitchen-dispatch fields

Current receipt-print UI exposes delivery states `idle`, `queued`, `printed`, `failed`, and `delivery-unknown`.

Known gap: historical print-delivery state is not currently persisted per receipt.

Production receipt print-job persistence should account for print-job ID, receipt ID, printer/device ID, status, command/idempotency identity, timestamps, retry/attempt evidence and safe error/unknown-delivery evidence.

`delivery-unknown` must never trigger a blind automatic duplicate print.

## Kitchen/preparation dispatch — REQUIRED-GAP

Future local/takeaway/delivery preparation requires durable evidence such as:

- preparation/kitchen dispatch ID;
- order/ticket ID;
- fulfillment mode;
- service area/place when local;
- sales channel when operationally relevant;
- routed station/printer/KDS target;
- revision/version;
- line/product quantity delta or void delta;
- idempotency/command identity;
- queued/sent/acknowledged/unknown/failure state as supported;
- timestamps.

This is required so later additions to an open local order can produce only the required delta and reconnect/retry behavior cannot silently duplicate kitchen work.

---

# 13. Search/barcode gap that must not be forgotten

The current Quick Sale UI promises barcode/SKU-oriented selling, but the current mock Product model has neither SKU nor barcode identity and catalog search currently matches product name only.

> **Barcode/SKU is a documented UI-to-data gap, not a completed backend capability.**

Before production Quick Sale acceptance: add fields to the catalog contract/model, define uniqueness/scope, resolve scanner input through the contract, add exact lookup tests and preserve scanner-first focus behavior.

---

# 14. UI-only state that must NOT become database truth

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
- decorative payment artwork/background opacity;
- currently selected service-area tab;
- map/list responsive presentation mode;
- green/silver visual emphasis of action slots.

Persist only when a real recovery/product requirement explicitly demands it.

---

# 15. Current high-priority data gaps discovered from UI/product work

Before the POS data model can be called complete for the functionality now visible or explicitly approved as the next restaurant direction, close or explicitly defer:

1. replace the temporary order-type UI concept with durable `fulfillmentMode` semantics;
2. add `salesChannelId` and channel configuration before delivery-platform scope;
3. add table/local-service enablement, service areas and service places;
4. normalize open-order lifecycle rather than relying on generic Save semantics;
5. add channel-aware pricelist/product override support and preserve effective price evidence;
6. add kitchen dispatch/revision/delta/idempotency records;
7. add real `sku` and barcode identity/search behind the catalog contract;
8. create durable checkout/payment records suitable for restart/idempotency and future split payments;
9. persist stable branch/device/employee IDs on completed receipts;
10. persist receipt print-job history/status;
11. move device preferences from ad-hoc browser keys into structured local/configuration persistence;
12. keep card/مدى production fields reserved but do not claim terminal integration until a real provider adapter is proven.

---

# 16. Change-control rule

When a new visible field, label, option, fulfillment mode, sales channel, price context, payment method, customer attribute, receipt fact, setting, kitchen state or status is added to the POS UI/product direction:

1. update this register in the same PR;
2. mark it CURRENT / REQUIRED-GAP / RESERVED-INTEGRATION / DERIVED / UI-ONLY;
3. update the Rifad contract/model when it becomes durable business data;
4. update the UI Execution Manifest before implementation if screen/action behavior changes;
5. add persistence/restart/idempotency tests when the field must survive failure/restart;
6. do not wait until database implementation to discover the field.

This register is the guardrail against “the UI had the field, but the data model forgot it.”
