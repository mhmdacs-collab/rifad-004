# Rifad POS UI Naming and Field Register

Last updated: 2026-08-17

## Purpose

Canonical register for POS-facing labels, durable product data requirements and known persistence/integration gaps. It is not a frozen SQL schema.

Use with:

- `UI_EXECUTION_MANIFEST.json` — implementation scope/readiness;
- `DESIGN_AUTHORITY.md` — interaction/visual authority;
- `UI_PROGRESS.md` — implementation status;
- `apps/pos/src/domain/models.ts` — current executable model;
- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`;
- `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`.

## Status legend

- **CURRENT** — exists now in executable Rifad model/contract.
- **REQUIRED-GAP** — approved/required product data not yet durable.
- **RESERVED-INTEGRATION** — must be accounted for before named production integration is claimed.
- **DERIVED** — calculated from authoritative data.
- **UI-ONLY** — presentation state; do not persist merely because it is visible.

---

# 1. Human interaction authority

> **Touch first, then human visual clarity, then beauty.**

- frequent targets are human/finger sized;
- constrained screens change layout/density before shrinking key actions;
- primary completion actions stay outside repeatable scrolling content when practical;
- transaction action slots stay physically stable across adjacent states;
- dynamic keypad validation reserves stable geometry;
- responsive QA covers large POS, 1366×768, tablet landscape, short-height and mobile/narrow layouts.

---

# 2. Canonical cashier-facing terminology

## Sales modes

| Concept | Arabic |
| --- | --- |
| Touch/product-page mode | **شاشة لمس** |
| Search/barcode-first mode | **البيع السريع** |

Internal persisted value `basic` may remain for compatibility; cashier-facing **شاشة أساسية** is deprecated.

## Main actions

| Concept | Canonical label | Meaning |
| --- | --- | --- |
| General checkout | **دفع** | Current/target checkout entry. |
| Prototype generic save | **حفظ** | Current prototype only; not permanent restaurant meaning. |
| Restaurant local service | **محلي** | Target restaurant-service action. Behavior depends on place-management configuration. |
| Resume advanced local orders | **طلبات مفتوحة** | Target when place-managed local orders exist; optional `· N` count. |
| Credit sale | **آجل** | Current customer-credit path. |
| Debt settlement | **سداد** | Current debt/cash-completion context. |
| Clear current basket | **مسح السلة** | Current minimal destructive label. |

`سداد` is not the general Sales-screen checkout label; general checkout is **دفع**.

## Restaurant fulfillment

Target durable `fulfillmentMode`:

| Value | Arabic | Meaning |
| --- | --- | --- |
| `takeaway` | **سفري** | Default restaurant direct-sale preparation. |
| `dine_in` | **محلي** | Local/dine-in preparation, with or without exact place. |
| `delivery` | **توصيل** | Delivery/online fulfillment. |

The current visible prototype selector **محلي / سفري / توصيل** is staging UI and must not become the permanent interaction merely because it exists now.

## Sales channels

Target durable `salesChannelId` examples:

- direct POS;
- Keeta;
- HungerStation;
- Jahez;
- Ninja;
- future marketplace/online channels.

## Payment / collection / settlement

These are separate from channel and fulfillment:

- **نقدًا** — current cash path;
- **شبكة / مدى** — current mock card UX;
- **آجل** — customer credit;
- prepaid by platform — REQUIRED-GAP/RESERVED-INTEGRATION;
- cash/card due on delivery/pickup — REQUIRED-GAP;
- platform settlement — REQUIRED-GAP/RESERVED-INTEGRATION.

A cashier may see a platform tile beside payment/completion choices, but channel identity must not be stored only as `paymentMethod`.

---

# 3. Product/catalog/pricing fields

## Product

| Field | Status | Reason |
| --- | --- | --- |
| `id` | CURRENT | Stable identity. |
| `name` | CURRENT | Catalog/ticket/search. |
| `categoryId`, `categoryName` | CURRENT | Grouping. |
| base `price` | CURRENT | Direct/base price. |
| `abbreviation` | CURRENT | Compact visual. |
| `sku` | **REQUIRED-GAP** | Quick Sale scanner/search promise. |
| `barcodes[]` | **REQUIRED-GAP** | Real barcode lookup. |
| channel pricelist/product override | **REQUIRED-GAP** | Different selling price by platform/channel. |
| `tone` | UI-ONLY | Prototype styling. |

Production channel pricing should use normalized pricelist/override records rather than permanent columns such as `keetaPrice` and `hungerStationPrice` on every product.

Required pricing evidence:

- base price;
- price-context/pricelist identity;
- optional product override;
- effective sold price;
- effective price snapshot on ticket/receipt/external order;
- version/effective dates when history matters.

Platform commission/fee is not customer-facing product price.

---

# 4. Sale-page layout

Current `SalePage`:

- `id` — CURRENT;
- `name` — CURRENT;
- `isDefault` — CURRENT;
- `productSlots[]` — CURRENT mock representation.

Production normalization should preserve page identity/order/slot/product relation/configuration scope explicitly.

---

# 5. Ticket and open-order fields

## Ticket

| Field | Status | Notes |
| --- | --- | --- |
| `id`, `sequence`, `lines` | CURRENT | Current sale identity/content. |
| customer reference/snapshot | CURRENT concept | Mock currently carries customer. |
| `subtotal`, `loyaltyRedemption`, `taxIncluded`, `total` | CURRENT | Money evidence. |
| `updatedAt` | CURRENT | Current update time. |
| `fulfillmentMode` | **REQUIRED-GAP** | Takeaway/dine-in/delivery. |
| `salesChannelId` | **REQUIRED-GAP** | Direct/platform source. |
| `priceContextId` / pricelist snapshot | **REQUIRED-GAP** | Channel pricing traceability. |
| `serviceAreaId` | **REQUIRED-GAP** | Advanced local only. |
| `servicePlaceId` | **REQUIRED-GAP** | Advanced local table/room/session/place. |
| open-order lifecycle/status | **REQUIRED-GAP** | Working/open/paid/cancelled etc. |
| created timestamp | **REQUIRED-GAP** | Audit/elapsed time. |
| stable branch/device/employee refs | **REQUIRED-GAP** | Multi-device audit. |
| kitchen/preparation revision evidence | **REQUIRED-GAP** | Delta/idempotency. |
| external-order link | **RESERVED-INTEGRATION** | Platform order identity when connected. |

Do not promote temporary prototype `orderType` UI state into permanent schema. Target meaning belongs in `fulfillmentMode` plus configuration/channel fields.

## TicketLine

CURRENT: `id`, `productId`, `name`, `unitPrice`, `quantity`.

Additional requirements:

- line total — DERIVED;
- effective price source/channel context — REQUIRED-GAP;
- external item/SKU/modifier mapping — RESERVED-INTEGRATION;
- preparation sent-quantity/revision relation — REQUIRED-GAP when kitchen deltas are implemented.

---

# 6. Restaurant-service configuration

Restaurant semantics and place management are **two layers**.

## Branch/POS configuration

| Field | Status | Meaning |
| --- | --- | --- |
| `restaurantServiceEnabled` | **REQUIRED-GAP** | Enables restaurant local/takeaway semantics. OFF keeps retail/direct POS clean. |
| `servicePlaceManagementEnabled` | **REQUIRED-GAP** | Optional sub-capability; requires restaurant service. Enables areas/places/open local orders. |

Target behavior:

- restaurant service OFF → no forced **محلي/سفري** workflow;
- restaurant service ON + place management OFF → **محلي** marks local then checkout; direct **دفع** = سفري;
- restaurant service ON + place management ON → **محلي** requires place selection and produces an open local order.

Production ownership is expected in Back Office. POS-side configuration may exist temporarily during UI-first proof but should not become ordinary-cashier authority.

## ServiceArea — advanced mode

REQUIRED-GAP:

- `id`;
- `name`;
- branch/config scope;
- display order;
- active flag;
- optional layout metadata later.

Examples: الصالة، الدور الأول، الغرف، الجلسات الخارجية.

## ServicePlace — advanced mode

REQUIRED-GAP:

- `id`;
- `serviceAreaId`;
- cashier-facing name/code;
- active flag;
- capacity/seats when later approved;
- x/y/size/shape only when Back Office floor-layout editing is approved.

Examples: طاولة 12، غرفة 3، جلسة 8.

Current area tab, selection, card colors and responsive map/list mode are UI-ONLY.

---

# 7. Checkout/payment/collection fields

Current checkout concepts include checkout identity, ticket identity, method selection and command/idempotency identity. Production restart requires durable status/timestamps and command evidence.

Future normalized payment records must support more than one record per receipt and should include:

- payment ID;
- ticket/checkout/receipt relation;
- method;
- authoritative amount;
- status;
- command/idempotency key;
- timestamps;
- external provider/reference when applicable.

Cash current evidence:

- `tendered` — CURRENT;
- `change` — CURRENT/preserved derived result.

Production Mada/card reserve legitimate terminal/acquirer facts, but never full PAN, PIN, CVV or track data.

---

# 8. External delivery-channel integration fields

A connected external order needs normalized Rifad fields plus raw external references for support/reconciliation.

## Channel connection/configuration

| Field/concept | Status |
| --- | --- |
| channel adapter/provider identity | **REQUIRED-GAP** |
| integration mode: direct / aggregator | **REQUIRED-GAP** |
| authorization/connection status | **RESERVED-INTEGRATION** |
| external merchant/chain/store IDs | **RESERVED-INTEGRATION** |
| Rifad branch ↔ external store mapping | **RESERVED-INTEGRATION** |
| enabled adapter capabilities | **RESERVED-INTEGRATION** |
| auto-accept policy | **REQUIRED-GAP** when online-order flow is authorized |
| auto-send-to-kitchen policy | **REQUIRED-GAP** |
| online-order receiving device/branch policy | **REQUIRED-GAP** |

Secrets/tokens must use secure configuration storage, not ordinary cashier-editable fields or receipt/ticket data.

## ExternalOrder

RESERVED-INTEGRATION / REQUIRED-GAP before production delivery integration:

- external order ID;
- external display/order/rider handoff code;
- external event/webhook ID;
- channel/store identity;
- fulfillment type;
- external item/SKU/modifier IDs and mapping;
- external sold unit/line totals;
- customer-facing discount/fee snapshots;
- payment collection state (`prepaid`, `due_on_delivery`, `due_on_pickup`, etc.);
- external payment/reference facts when supplied;
- order status and timestamps;
- cancellation/refund state;
- source payload/version/hash or safe audit evidence as required;
- webhook idempotency/acknowledgment state.

For API-connected external orders, external sold prices are historical order evidence. Do not overwrite them silently with the current local base price.

## Platform settlement/reconciliation

Separate from the sale itself:

- platform receivable/clearing identity — REQUIRED-GAP for accounting integration;
- settlement batch/reference — RESERVED-INTEGRATION;
- gross sale amount — REQUIRED-GAP/snapshot;
- platform commission/fee components — RESERVED-INTEGRATION;
- promotion contribution/other deductions — RESERVED-INTEGRATION;
- net payable/paid amount — RESERVED-INTEGRATION;
- settlement status/date — RESERVED-INTEGRATION.

Some platform settlement fields may arrive later than the order event; order acceptance/kitchen processing must not depend on all financial settlement details already being complete.

## Adapter capabilities

Rifad should query connector capabilities rather than hard-code platform-specific UI branches. Potential capabilities:

- authorization;
- store mapping;
- menu/pricelist sync;
- item availability sync;
- order webhook/polling;
- accept/reject;
- prepare/ready;
- dispatch/delivered;
- cancel/refund;
- payment detail;
- settlement/reconciliation.

Adapters may be direct platform adapters or approved aggregator adapters.

---

# 9. Receipt fields

Current executable receipt includes:

- `id`, `number`, `paymentMethod`;
- product/item snapshots;
- subtotal/redemption/tax/total;
- tendered/change;
- loyalty earned;
- completion timestamp;
- employee/branch name snapshots;
- customer snapshot when attached.

Required before restaurant/channel production completeness:

- `fulfillmentMode` — REQUIRED-GAP;
- `salesChannelId` + safe channel snapshot — REQUIRED-GAP;
- service area/place relation/snapshot when advanced local — REQUIRED-GAP;
- price-context evidence — REQUIRED-GAP;
- external order reference when platform-sourced — RESERVED-INTEGRATION;
- collection/payment records — REQUIRED-GAP;
- stable employee/branch/device IDs — REQUIRED-GAP;
- fiscal/ZATCA and refund/cancellation evidence when implemented.

---

# 10. Customer fields

CURRENT executable/mock persistence:

- `id`;
- `name`;
- `mobile` — exactly `05XXXXXXXX` in current local Saudi UX;
- `email`;
- `address`;
- `city`;
- `region`;
- `postalCode`;
- `country`;
- `customerCode`;
- `taxNumber` — presence does not imply complete ZATCA compliance;
- `note`;
- convenience debt balance.

Production needs normal audit timestamps and final fiscal validation rules.

## Debt ledger

CURRENT:

- `id`;
- `customerId`;
- kind: `opening | credit-sale | payment`;
- direction: `debit | credit`;
- amount;
- `createdAt`;
- related ticket sequence when applicable.

Debt-dialog keypad/feedback/result display state remains UI-ONLY.

---

# 11. Loyalty

Current concepts include program config, balance/status, redemption quote, applied redemption, earned value and purchase history.

Production should use durable loyalty transaction evidence rather than mutable balance snapshots alone.

---

# 12. Device/employee/preferences/configuration

## CURRENT session data

Device:

- `deviceId`, `deviceName`, `branchId`, `branchName`, `linkedEmail`.

Employee:

- `employeeId`, `employeeName`, `roleName`.

## Current device-local preferences

- sale mode `touch | basic`;
- temporary visible order-type selector preference;
- `printReceiptAlways`.

The generic visible order-type preference is staging behavior and should be superseded by structured restaurant-service/channel configuration.

## Required structured configuration

- `restaurantServiceEnabled` — REQUIRED-GAP;
- `servicePlaceManagementEnabled` — REQUIRED-GAP;
- service areas/places — REQUIRED-GAP when advanced mode is enabled;
- allowed sales channels — REQUIRED-GAP;
- channel pricelist mapping — REQUIRED-GAP;
- online-order auto-accept/kitchen policy — REQUIRED-GAP when authorized;
- external connector mappings/credentials — RESERVED-INTEGRATION and Back Office/security owned.

---

# 13. Printing and kitchen/preparation dispatch

Receipt print delivery UI currently exposes:

`idle / queued / printed / failed / delivery-unknown`.

Historical receipt print jobs are not durable yet.

Production receipt print jobs require ID, receipt, target printer/device, status, command/idempotency identity, timestamps, attempts and safe unknown-delivery evidence. Never blindly duplicate `delivery-unknown` jobs.

## Kitchen/preparation dispatch — REQUIRED-GAP

Future dispatch evidence:

- dispatch ID;
- order/ticket ID;
- fulfillment mode;
- service place when advanced local;
- sales channel when useful;
- target station/printer/KDS;
- revision/version;
- line quantity additions/void deltas;
- idempotency identity;
- queued/sent/acknowledged/unknown/failure state;
- timestamps.

API-connected delivery orders may be auto-accepted/sent according to policy, but retry/reconnect must not duplicate kitchen work.

---

# 14. Search/barcode gap

Current Quick Sale visually promises scanner/SKU selling while current Product has no durable SKU/barcode identity and mock search matches name only.

Before production Quick Sale acceptance:

- add SKU/barcode fields;
- define uniqueness/scope;
- route scanner input through catalog contract;
- add exact lookup tests;
- preserve scanner-first focus behavior.

---

# 15. UI-only state that must not become database truth

Examples:

- open dialogs/menus;
- hover/pressed/animation state;
- keypad freshness/digits before command;
- scroll position;
- responsive breakpoint/layout mode;
- visual `tone`;
- validation presentation classes;
- current service-area tab;
- map/list responsive representation;
- green/silver action emphasis;
- online-order badge animation/pulse.

Persist only when a real recovery/product requirement explicitly demands it.

---

# 16. Current high-priority gaps

Before POS data can be considered complete for visible/approved direction, close or explicitly defer:

1. replace temporary `orderType` UI with durable `fulfillmentMode` semantics;
2. add **two-level** restaurant configuration: service semantics + optional place management;
3. add service areas/places and open-order lifecycle for advanced local mode;
4. add `salesChannelId` and normalized channel configuration;
5. add channel-aware pricelist/product overrides and effective price snapshots;
6. define delivery-channel adapter capability contract supporting direct and aggregator implementations;
7. add external-order IDs/mappings/payment-collection/webhook-idempotency records;
8. add platform settlement/reconciliation records separately from sales/payment-at-till;
9. add kitchen dispatch revision/delta/idempotency records;
10. add real SKU/barcode catalog identity;
11. normalize durable checkout/payment records for restart/idempotency/split payment;
12. persist stable branch/device/employee IDs on receipts;
13. persist receipt print-job history;
14. migrate temporary browser/device settings to structured local/Back Office configuration;
15. keep Mada/card production fields reserved until a real terminal adapter is proven.

---

# 17. Change-control rule

When product/UI introduces a new visible or durable field, fulfillment mode, service setting, sales channel, integration mapping, price context, payment/collection state, customer attribute, receipt fact, kitchen state or status:

1. update this register in the same PR;
2. classify it CURRENT / REQUIRED-GAP / RESERVED-INTEGRATION / DERIVED / UI-ONLY;
3. update Rifad contracts/model when it becomes durable business data;
4. update UI Execution Manifest before implementation when behavior/screen scope changes;
5. add persistence/restart/idempotency tests where failure recovery matters;
6. do not wait for database implementation to discover the requirement.
