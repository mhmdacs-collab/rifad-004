# Rifad POS UI Naming and Field Register

Last updated: 2026-08-17

## Purpose

Canonical register for POS-facing terminology, executable fields, mock-only proof fields, durable production requirements, integration reservations, derived values and UI-only state.

This is **not** a frozen SQL schema. It is the traceability bridge between visible product behavior and future Rifad-owned persistence/contracts.

Use with `UI_EXECUTION_MANIFEST.json`, `DESIGN_AUTHORITY.md`, `UI_PROGRESS.md`, current domain/contracts under `apps/pos/src/`, and restaurant/delivery research under `docs/research/restaurant-pos/`.

## Status legend

- **CURRENT** — exists in the current executable Rifad model/contract and established mock runtime.
- **CURRENT-MOCK** — exists specifically in the executable UI-proof/mock contract or local staging storage; proves interaction but is not yet the production durable model.
- **REQUIRED-GAP** — approved durable product data still missing from the production-target contract/model.
- **RESERVED-INTEGRATION** — required before a named real integration is claimed.
- **DERIVED** — calculated from authoritative facts.
- **UI-ONLY** — presentation state that should not become durable truth merely because it appears in UI.

---

# 1. Canonical cashier terminology

| Concept | Label | Status / meaning |
| --- | --- | --- |
| Touch/page grid | **شاشة لمس** | CURRENT |
| Search/barcode-first | **البيع السريع** | CURRENT; internal `basic` compatibility may remain |
| General checkout | **دفع** | CURRENT |
| Restaurant local alternative | **محلي** | CURRENT-MOCK in POS-FLOW-002; simple → checkout, advanced → place selector |
| Advanced open local orders | **طلبات مفتوحة** | CURRENT-MOCK; may display `طلبات مفتوحة · N` |
| Update reopened advanced local order | **إرسال** | CURRENT-MOCK; mock kitchen revision/update only |
| Credit sale | **آجل** | CURRENT |
| Cash/debt completion | **سداد** | CURRENT |
| Attach customer | **إضافة عميل إلى التذكرة** | CURRENT |
| Clear basket | **مسح السلة** | CURRENT |
| Legacy generic ticket save | **حفظ** | legacy/prototype; not target restaurant meaning |

Do not use **سداد** as the general sales-screen checkout label.

## Fulfillment / kitchen-service meaning

Target durable field: `fulfillmentMode`.

| Durable value | Arabic | Production status |
| --- | --- | --- |
| `takeaway` | **سفري** | REQUIRED-GAP; currently inferred/presented by restaurant prototype |
| `dine_in` | **محلي** | REQUIRED-GAP; current proof keeps local context in mock service state |
| `delivery` | **توصيل** | REQUIRED-GAP; future delivery-channel flow |

The old visible **محلي / سفري / توصيل** selector is superseded and hidden in the normal current local-service UI. Do not promote its old `orderType` shape into production schema.

---

# 2. Product / catalog / pricing

## Product

| Field | Status | Reason |
| --- | --- | --- |
| `id` | CURRENT | stable identity |
| `name` | CURRENT | tile/ticket/search |
| `categoryId` / `categoryName` | CURRENT | catalog organization |
| base `price` (`Money`) | CURRENT | direct-price authority |
| `abbreviation` | CURRENT | compact visual use |
| `sku` | REQUIRED-GAP | Quick Sale/scanner promise |
| barcode identity / `barcodes[]` | REQUIRED-GAP | exact scanner lookup |
| channel pricelist/product override | REQUIRED-GAP | delivery-platform selling prices |
| `tone` | UI-ONLY | prototype visual treatment |

Completed receipts must preserve historical product name/effective selling price snapshots.

Production pricing needs base price, price-context/pricelist identity, optional product override, resolved effective price, sold-price snapshot and version/effective-date rules where required. Platform commission/settlement fee is separate from customer-facing product price.

---

# 3. Ticket / working sale

CURRENT: `id`, `sequence`, `lines`, customer concept, subtotal, loyalty redemption, tax included, total, updatedAt.

Restaurant/channel production additions:

| Field | Status | Reason |
| --- | --- | --- |
| `fulfillmentMode` | REQUIRED-GAP | authoritative takeaway/dine-in/delivery |
| `salesChannelId` | REQUIRED-GAP | direct vs platform source |
| `priceContextId` / pricelist evidence | REQUIRED-GAP | channel pricing |
| `serviceAreaId` | REQUIRED-GAP | advanced local location |
| `servicePlaceId` | REQUIRED-GAP | table/room/session |
| durable open-order ID/status | REQUIRED-GAP | production lifecycle |
| created timestamp | REQUIRED-GAP | audit/elapsed time |
| stable branch/device/employee refs | REQUIRED-GAP | multi-device/audit |
| kitchen sent quantities/revisions | REQUIRED-GAP | preparation deltas/retry safety |

TicketLine current fields: `id`, `productId`, `name`, `unitPrice`, `quantity`; line total is DERIVED. Effective price source/channel and kitchen sent-quantity/revision are REQUIRED-GAP. Visual tone is UI-ONLY.

---

# 4. Restaurant service configuration / open orders

`POS-FLOW-002` introduced executable UI-proof types in `apps/pos/src/domain/restaurantService.ts`, `RestaurantServiceContract`, and local mock adapter/storage.

These are **CURRENT-MOCK**: intentional testable product evidence, not final production persistence.

## RestaurantServiceConfig

| Field | Status | Meaning |
| --- | --- | --- |
| `restaurantServiceEnabled` | CURRENT-MOCK / production REQUIRED-GAP | enables restaurant semantics |
| `placeManagementEnabled` | CURRENT-MOCK / production REQUIRED-GAP | enables exact place workflow |

## ServiceArea

`id`, `name`, `places[]` are CURRENT-MOCK. Production still needs normalized branch/POS scope, display order, active state and later Back Office layout ownership. Current demo areas: **الصالة / الغرف / الجلسات**.

## ServicePlace

`id`, `serviceAreaId`, `name`, `kind: table | room | session` are CURRENT-MOCK. Production active state is REQUIRED-GAP; capacity/seats and x/y/shape remain future scope.

## OpenLocalOrder

CURRENT-MOCK:

- `id`, `commandId`;
- stored Ticket snapshot;
- area/place IDs + names;
- `openedAt`, `updatedAt`;
- `kitchenRevision`.

Production must replace/normalize this proof shape with authoritative open-order lifecycle, local persistence/sync and real kitchen dispatch/outbox semantics. Do not freeze the mock snapshot as database schema.

Occupied/free colors, selected area, modal state, responsive map/list mode, toast visibility, action emphasis and scroll position are UI-ONLY.

---

# 5. Checkout / payment / settlement

Current checkout includes checkout identity, ticket link, selected method and command/idempotency identity.

Current methods:

- `cash` → **نقدًا** — CURRENT mock flow;
- `card` → **شبكة / مدى** — CURRENT mock UX only;
- `credit` → **آجل** — CURRENT customer-credit path.

Cash receipt evidence: `tendered` CURRENT; `change` CURRENT/preserved derived fact.

Future normalized payment records need identity, ticket/checkout/receipt links, method, authoritative amount, status, command key and timestamps. Production Mada reserves provider/acquirer, terminal ID, external reference, approval/auth reference, RRN when supplied, allowed masked-card reference, scheme/status/provider timestamps.

Never store full PAN, PIN, CVV or track data.

---

# 6. Delivery sales channels / online orders

Target durable concept: `salesChannelId`; examples direct POS, Keeta, HungerStation, Jahez, Ninja and future channels.

Real delivery adapters reserve:

- external order/reference and connector identity;
- external store/location mapping;
- webhook/event identity + idempotency;
- external status/timestamps;
- external sold-price snapshots;
- item/option mapping evidence;
- payment/collection state;
- settlement status/reference;
- commission/fee evidence;
- customer/address data only within approved privacy scope.

These remain RESERVED-INTEGRATION / REQUIRED-GAP until a real connector is authorized. Channel identity must never be inferred solely from payment method.

---

# 7. Receipt fields

CURRENT receipt includes ID/number/payment method, item snapshots, subtotal/redemption/tax/total, tendered/change/loyalty earned, completion time, employee/branch name snapshots and customer snapshot.

Restaurant/channel production additions remain REQUIRED-GAP: fulfillment, channel snapshot, place/area relation or historical snapshot, price-context evidence, stable employee/branch/device IDs, durable payment links, and future fiscal/refund/cancellation evidence.

---

# 8. Customer / debt

Customer CURRENT: `id`, `name`, `mobile`, email, address, city, region, postalCode, country, customerCode, taxNumber, note and current debt convenience balance.

Create/edit enforces local Saudi `05XXXXXXXX` (10 digits). Tax-number presence alone is not ZATCA-compliance evidence.

DebtLedgerEntry CURRENT: ID/customer, kind `opening | credit-sale | payment`, direction `debit | credit`, amount, createdAt and related ticket sequence when applicable.

Future debt permissions/due dates/aging/limits/settlement methods/statement export remain unscoped.

---

# 9. Loyalty

CURRENT contract/model concepts include program configuration, customer status/balance, qualifying purchases, rewards, redemption quote/applied redemption, loyalty earned and purchase history. Production should eventually use durable loyalty transaction evidence.

---

# 10. Device / employee / configuration

DeviceSession CURRENT: device ID/name, branch ID/name, linked email.

EmployeeSession CURRENT: employee ID/name, role name.

Executable local preferences/configuration:

- sale mode `touch | basic` — CURRENT;
- `printReceiptAlways` — CURRENT;
- restaurant service ON/OFF — CURRENT-MOCK staging;
- place management ON/OFF — CURRENT-MOCK staging.

The legacy generic visible-order-type setting is superseded/hidden in normal current UI.

Production Back Office should own persistent restaurant areas/places, channels/pricelists, connector mappings/credentials and online-order policies where appropriate.

---

# 11. Printing / kitchen dispatch

Receipt-print UI states CURRENT: `idle`, `queued`, `printed`, `failed`, `delivery-unknown`.

Production print history needs durable job/receipt/printer/device links, status, command identity, timestamps, attempts and safe unknown-delivery evidence. `delivery-unknown` must not cause blind duplicate print.

`POS-FLOW-002` has a **CURRENT-MOCK `kitchenRevision`** proving that an advanced local order can be sent, reopened and updated without creating a second open place. It is not real kitchen transport.

Production kitchen REQUIRED-GAP: dispatch ID, order/ticket ID, fulfillment, place when local, channel when relevant, routed printer/KDS/station, revision/version, line/void deltas, idempotency/outbox identity, delivery state and timestamps.

---

# 12. Search/barcode gap

Quick Sale promises scanner/SKU-oriented use but Product has no real SKU/barcode identity and mock search remains name-only.

> **Barcode/SKU is a documented data gap, not a completed backend capability.**

---

# 13. UI-only state

Do not persist merely because visible: dialog/menu state, hover/pressed/animation, keypad digits/freshness, temporary numeric input, responsive mode, decorative tone, scroll position, validation CSS state, selected service area, map/list presentation, green/silver emphasis, local-service toast or modal state.

---

# 14. Highest-priority production gaps

1. authoritative `fulfillmentMode`;
2. production restaurant configuration;
3. authoritative service areas/places/open-order lifecycle + multi-device sync;
4. durable kitchen delta/idempotency/outbox;
5. `salesChannelId` and channel configuration;
6. channel-aware pricing/effective sold-price evidence;
7. direct/aggregator delivery adapter contract + external IDs/mappings/webhook idempotency;
8. platform payment-collection + settlement/reconciliation;
9. SKU/barcode identity/search;
10. durable checkout/payment records;
11. stable employee/branch/device IDs on receipts;
12. print-job history;
13. structured business/device configuration;
14. legitimate Mada references without prohibited sensitive data.

---

# 15. Change-control rule

When visible product work introduces a field/label/option/fulfillment/channel/price/payment fact/restaurant setting/kitchen state:

1. update this register in the same PR;
2. classify CURRENT / CURRENT-MOCK / REQUIRED-GAP / RESERVED-INTEGRATION / DERIVED / UI-ONLY;
3. update Rifad contracts/models when it becomes authoritative durable business data;
4. update the UI Execution Manifest before behavior implementation where required;
5. add restart/idempotency tests for state that must survive failure/restart;
6. do not wait for SQL design to discover visible business requirements.
