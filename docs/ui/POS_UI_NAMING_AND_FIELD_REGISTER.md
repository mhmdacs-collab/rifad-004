# Rifad POS UI Naming and Field Register

Last updated: 2026-08-18

## Purpose

Canonical register for POS-facing terminology, executable fields, mock-only proof fields, durable production requirements, integration reservations, derived values and UI-only state. Back Office fields that directly define POS business data are also recorded here while the shared product model is being discovered.

This is **not** a frozen SQL schema. It is the traceability bridge between visible product behavior and future Rifad-owned persistence/contracts.

Use with `UI_EXECUTION_MANIFEST.json`, `DESIGN_AUTHORITY.md`, `UI_PROGRESS.md`, current Rifad contracts/core/adapters, and restaurant/delivery research under `docs/research/restaurant-pos/`.

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

`BO-FLOW-002` is now the first executable cross-surface catalog discovery slice. It introduces a Rifad-owned `CatalogAdminContract` / `CatalogReadContract` staging model shared with the POS catalog adapter. The current browser transport is proof only; these fields are not a frozen SQL schema.

| Field | Status | Reason |
| --- | --- | --- |
| `id` | CURRENT / CURRENT-MOCK shared catalog | stable identity reused by Back Office and POS |
| `name` | CURRENT | Back Office display/edit, POS tile/ticket/search |
| `description` | CURRENT-MOCK | visible/editable in BO-FLOW-002; future durable product description |
| `categoryId` / `categoryName` | CURRENT | catalog organization; BO-FLOW-002 selects an existing category only |
| base `price` (`Money`) | CURRENT | direct-price authority; BO-FLOW-002 edits exact halalas |
| `sku` | CURRENT-MOCK / production durable required | BO list/editor and POS staging search by SKU |
| `barcode` | CURRENT-MOCK / production durable required | BO list/editor and POS staging exact-string search; scanner hardware not yet proven |
| `availableForSale` | CURRENT-MOCK | false keeps item in Back Office and removes it from current sellable POS catalog |
| `soldBy = each` | CURRENT-MOCK fixed | current bounded slice sells by unit only; weight/volume behavior is still REQUIRED-GAP |
| `createdAt` / `updatedAt` | CURRENT-MOCK | staging catalog lifecycle evidence; final audit semantics not frozen |
| `abbreviation` | DERIVED | current POS compact tile helper derived from product name; should not become authoritative product truth merely for presentation |
| channel pricelist/product override | REQUIRED-GAP | delivery-platform selling prices |
| branch/store-specific availability/price | REQUIRED-GAP | future branch-aware catalog configuration |
| cost / inventory tracking / low-stock threshold | REQUIRED-GAP, not BO-FLOW-002 | documented Back Office features pending their own UI slice |
| tax assignment | REQUIRED-GAP, not BO-FLOW-002 | pending tax/product UI and fiscal/accounting design |
| variants / modifiers / composite structure | REQUIRED-GAP, not BO-FLOW-002 | pending dedicated UI flows |
| product image / POS visual appearance | future/UI scope | not authorized by current bounded Back Office slice |
| `tone` | UI-ONLY | prototype visual treatment |

### Current BO-FLOW-002 field boundary

Current editable fields are deliberately limited to:

- name;
- description;
- existing category selection;
- fixed base price;
- SKU;
- barcode;
- available-for-sale.

The current slice does **not** authorize category CRUD, variants, modifiers, cost, stock, open-price products, weight/volume selling, taxes, composite items, per-store overrides, delete, import/export or product imagery. Those fields stay discoverable from their own UI flows before production data-model freeze.

Completed receipts must preserve historical product name/effective selling price snapshots even if the product is later renamed, repriced or disabled.

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
| `placeGroupId` | REQUIRED-GAP | advanced local group/location relation |
| `servicePlaceId` | REQUIRED-GAP | exact table/room/session/custom place |
| durable open-order ID/status | REQUIRED-GAP | production lifecycle |
| created timestamp | REQUIRED-GAP | audit/elapsed time |
| stable branch/device/employee refs | REQUIRED-GAP | multi-device/audit |
| kitchen sent quantities/revisions | REQUIRED-GAP | preparation deltas/retry safety |

TicketLine current fields: `id`, `productId`, `name`, `unitPrice`, `quantity`; line total is DERIVED. Effective price source/channel and kitchen sent-quantity/revision are REQUIRED-GAP. Visual tone is UI-ONLY.

A newly added ticket line uses the catalog facts resolved at the time it is added. Later Back Office edits must not silently rewrite already-completed receipt snapshots.

---

# 4. Restaurant service configuration / open orders

`POS-FLOW-002` introduced executable UI-proof types in `apps/pos/src/domain/restaurantService.ts`, `RestaurantServiceContract`, and local staging adapter/storage.

These are **CURRENT-MOCK**: intentional testable product evidence, not final production persistence.

## RestaurantServiceConfig

| Field | Status | Meaning |
| --- | --- | --- |
| `restaurantServiceEnabled` | CURRENT-MOCK / production REQUIRED-GAP | enables restaurant semantics |
| `placeManagementEnabled` | CURRENT-MOCK / production REQUIRED-GAP | enables exact place workflow |

## PlaceGroup

`id`, `name`, `places[]` are CURRENT-MOCK. The cashier-facing model is generic **مجموعة → أماكن**. The current default is exactly one group **الطاولات** containing **طاولة 1..6**. Rooms, sessions, outdoor, VIP or other groups are not seeded by default and will later belong to Back Office configuration.

Production still needs normalized branch/POS scope, display order, active state and Back Office ownership.

## ServicePlace

`id`, `placeGroupId`, `name` are CURRENT-MOCK. A place is intentionally generic rather than frozen to a `table | room | session` enum. Production active state and ordering are REQUIRED-GAP; capacity/seats and x/y/shape remain future product scope unless a later UI flow approves them.

## OpenLocalOrder

CURRENT-MOCK:

- `id`, `commandId`;
- stored Ticket snapshot;
- place-group/place IDs + names;
- `openedAt`, `updatedAt`;
- `kitchenRevision`.

Production must replace/normalize this proof shape with authoritative open-order lifecycle, local persistence/sync and real kitchen dispatch/outbox semantics. Do not freeze the mock snapshot as database schema.

Available/reserved colors, selected group, modal state, responsive list state, toast visibility, action emphasis and scroll position are UI-ONLY. Cashier labels for current place cards are **متاحة / محجوزة**.

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

These remain RESERVED-INTEGRATION / REQUIRED-GAP until the delivery/online-order UI and a real connector are separately authorized. Channel identity must never be inferred solely from payment method.

---

# 7. Receipt fields

CURRENT receipt includes ID/number/payment method, item snapshots, subtotal/redemption/tax/total, tendered/change/loyalty earned, completion time, employee/branch name snapshots and customer snapshot.

Restaurant/channel production additions remain REQUIRED-GAP: fulfillment, channel snapshot, place/group relation or historical snapshot, price-context evidence, stable employee/branch/device IDs, durable payment links, and future fiscal/refund/cancellation evidence.

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

Production Back Office should own persistent restaurant groups/places, channels/pricelists, connector mappings/credentials and online-order policies where appropriate. `BO-FLOW-002` begins Back Office product ownership only for its bounded catalog fields.

---

# 11. Printing / kitchen dispatch

Receipt-print UI states CURRENT: `idle`, `queued`, `printed`, `failed`, `delivery-unknown`.

Production print history needs durable job/receipt/printer/device links, status, command identity, timestamps, attempts and safe unknown-delivery evidence. `delivery-unknown` must not cause blind duplicate print.

`POS-FLOW-002` has a **CURRENT-MOCK `kitchenRevision`** proving that an advanced local order can be sent, reopened and updated without creating a second open place. It is not real kitchen transport.

Production kitchen REQUIRED-GAP: dispatch ID, order/ticket ID, fulfillment, place when local, channel when relevant, routed printer/KDS/station, revision/version, line/void deltas, idempotency/outbox identity, delivery state and timestamps.

---

# 12. SKU / barcode status

The former total SKU/barcode data gap is now partially closed **only for the staging catalog slice**:

- Back Office can store and edit one SKU and one barcode;
- duplicate non-empty SKU/barcode is rejected in the current adapter;
- POS staging catalog search resolves name, SKU or barcode;
- disabling an item removes it from sellable POS search.

This does **not** yet prove production barcode-scanner hardware behavior, multiple barcodes per item, barcode standards/normalization, branch/cloud synchronization, import/export or production persistence.

> **SKU/barcode identity exists in BO-FLOW-002 staging evidence; production scanner and synchronization support remain separate proof work.**

---

# 13. UI-only state

Do not persist merely because visible: dialog/menu state, hover/pressed/animation, keypad digits/freshness, temporary numeric input, responsive mode, decorative tone, scroll position, validation CSS state, selected service group, list presentation, green/silver emphasis, local-service toast or modal state, Back Office drawer visibility, current search text or current filter selection.

---

# 14. Highest-priority production gaps

1. continue UI/product field discovery before production database freeze;
2. authoritative `fulfillmentMode`;
3. production restaurant configuration;
4. authoritative place groups/places/open-order lifecycle + multi-device sync;
5. durable kitchen delta/idempotency/outbox;
6. `salesChannelId` and channel configuration;
7. channel-aware pricing/effective sold-price evidence;
8. direct/aggregator delivery adapter contract + external IDs/mappings/webhook idempotency;
9. platform payment-collection + settlement/reconciliation;
10. production SKU/barcode persistence, scanner behavior and synchronization;
11. durable checkout/payment records;
12. stable employee/branch/device IDs on receipts;
13. print-job history;
14. structured business/device configuration;
15. legitimate Mada references without prohibited sensitive data.

---

# 15. Change-control rule

When visible product work introduces a field/label/option/fulfillment/channel/price/payment fact/restaurant setting/kitchen state:

1. update this register in the same PR;
2. classify CURRENT / CURRENT-MOCK / REQUIRED-GAP / RESERVED-INTEGRATION / DERIVED / UI-ONLY;
3. update Rifad contracts/models when it becomes authoritative durable business data;
4. update the UI Execution Manifest before behavior implementation where required;
5. add restart/idempotency tests for state that must survive failure/restart;
6. do not wait for SQL design to discover visible business requirements;
7. do not freeze the production database merely because one UI slice has a staging storage shape.
