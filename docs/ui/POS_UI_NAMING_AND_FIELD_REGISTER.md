# Rifad POS UI Naming and Field Register

Last updated: 2026-08-19

## Purpose

Canonical register for POS-facing terminology, executable fields, mock/staging proof fields, durable production requirements, integration reservations, derived values and UI-only state. Back Office fields that directly define POS business data are also recorded while the shared product model is being discovered.

This is **not** a frozen SQL schema. It is the traceability bridge between visible product behavior, Rifad-owned contracts and future production persistence/synchronization.

Use with `UI_EXECUTION_MANIFEST.json`, `DESIGN_AUTHORITY.md`, `UI_PROGRESS.md`, `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`, current Rifad contracts/core/adapters and architecture capability boundaries.

## Status legend

- **CURRENT** — exists in the current executable Rifad model/contract and established runtime.
- **CURRENT-MOCK** — exists in executable UI-proof/mock/staging behavior; proves interaction/meaning but is not yet the production durable implementation.
- **REQUIRED-GAP** — approved/necessary durable product data still missing from the production-target contract/model.
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
| Legacy generic ticket save | **حفظ** | CURRENT behavior exists through SalesContract; dedicated open-ticket UI family remains incomplete |
| Receipts | **الإيصالات** | CURRENT executable list/reprint screen (`POS-SCREEN-016`) |

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

`BO-FLOW-002` is the executable cross-surface catalog discovery slice. It uses Rifad-owned `CatalogAdminContract` / `CatalogReadContract` meanings shared with the POS catalog adapter. The current browser transport and **schema-v4** snapshot are staging proof only; these fields are not a frozen SQL schema.

Merchant-facing terminology:

- **سعر واحد** — one fixed direct price;
- **أسعار متعددة** — price depends on an option such as size;
- **مجموعات الخيارات** — reusable option/price sets shared by many items;
- **مجموعة جاهزة** — item uses one reusable option group;
- **خيارات خاصة بهذا الصنف** — non-reusable item-only price choices;
- **تخصيص الأسعار لهذا الصنف** — sparse overrides while retaining the shared group;
- **الإضافات العامة** — reusable add-on groups;
- **إضافات خاصة بهذا الصنف** — item-private add-on groups;
- **العرض في نقطة البيع** — item representation by color/shape or image.

| Field | Status | Reason |
| --- | --- | --- |
| `id` | CURRENT / CURRENT-MOCK shared catalog | stable Rifad identity reused by Back Office and POS |
| `name` | CURRENT | Back Office display/edit, POS tile/ticket/search |
| `description` | CURRENT-MOCK | visible/editable in BO-FLOW-002; future durable description |
| `categoryId` / `categoryName` | CURRENT-MOCK shared catalog | category selection and POS presentation; normalized production storage not frozen |
| category `color` | CURRENT-MOCK | merchant-managed scanning/identity aid |
| `price` (`Money`) | CURRENT / CURRENT-MOCK | fixed-price authority; multiple-price staging uses convenience minimum preview only |
| `pricing.mode = fixed | option-group | custom-options` | CURRENT-MOCK | explicit fixed vs multiple-price policy |
| option-group `id/name/color` | CURRENT-MOCK | reusable merchant pricing group |
| option-group value `id/name/price` | CURRENT-MOCK | stable value and exact default price |
| `pricing.groupId` | CURRENT-MOCK | selected reusable group |
| `pricing.priceMode = inherit | custom` | CURRENT-MOCK | inheritance vs sparse override |
| `pricing.overrides[].valueId/price` | CURRENT-MOCK | only changed item-specific prices |
| item-private pricing `name/values[].id/name/price` | CURRENT-MOCK | non-reusable multiple prices |
| `sku` | CURRENT-MOCK / production durable required | BO list/editor and POS staging search |
| `barcode` | CURRENT-MOCK / production durable required | BO list/editor and POS staging exact search; scanner hardware not proven |
| `availableForSale` | CURRENT-MOCK | false keeps item manageable but excludes it from current sellable POS catalog |
| `soldBy = each` | CURRENT-MOCK fixed | weight/volume behavior remains REQUIRED-GAP |
| `appearance.mode = color | image` | CURRENT-MOCK | merchant-selected POS representation |
| `appearance.color` | CURRENT-MOCK | item accent color |
| `appearance.shape = square | rounded | circle` | CURRENT-MOCK | merchant-owned appearance semantics |
| `appearance.imageDataUrl` | CURRENT-MOCK staging transport | browser-only media transport; production asset identity remains open |
| `createdAt` / `updatedAt` | CURRENT-MOCK | staging lifecycle evidence |
| `modifierGroupIds[]` | CURRENT-MOCK | reusable add-on groups assigned to item |
| general add-on group `id/name/color` | CURRENT-MOCK | reusable add-on group |
| general add-on option `id/name/price` | CURRENT-MOCK | exact additional price |
| `privateModifierGroups[].id/name` | CURRENT-MOCK | item-private add-on group |
| private add-on option `id/name/price` | CURRENT-MOCK | item-private exact additional price |
| legacy `variantOptions[]` / `variants[]` | CURRENT-MOCK migration-only | old staging compatibility, not target merchant model |
| `abbreviation` | DERIVED | compact POS helper derived from name |
| channel pricelist/product override | REQUIRED-GAP | delivery/channel pricing |
| branch/store-specific availability/price | REQUIRED-GAP | future branch-aware catalog configuration |
| cost / inventory tracking / low-stock threshold | REQUIRED-GAP | dedicated inventory/product flow required |
| tax assignment | REQUIRED-GAP | MAP-01/MAP-03 configuration/sale-truth work |
| composite structure | REQUIRED-GAP | dedicated product flow |
| production media asset/storage identity | REQUIRED-GAP | browser image Data URL is staging only |
| `tone` | UI-ONLY | older prototype visual treatment |

### Pricing-option / add-on safety boundary

The current POS does **not** yet consume option-priced items or add-ons. `CatalogReadContract.listItems()` hides option-priced items by default until an approved cashier chooser exists. Back Office explicitly opts in with `includeOptionPriced: true`.

Before cashier sale, production must snapshot at least:

- selected option group/value identity and display text;
- exact resolved sold price;
- selected general/private add-ons and exact additional prices;
- discount/tax effects applicable to the line;
- kitchen/receipt presentation where applicable.

Completed receipts must preserve historical product/name/effective-price facts even after later catalog edits.

---

# 3. Sale pages / cashier layout

Current `SaleLayoutContract` behavior is CURRENT:

- list pages;
- create page;
- rename page;
- delete page;
- move/reorder page;
- place product in a slot;
- remove product from a slot.

Current sale-page layout is operational POS configuration/state in the staging runtime. Final owner-vs-device scope and production persistence are not frozen.

Selected page tab, drag/hover/temporary modal state and scroll positions are UI-ONLY.

---

# 4. Ticket / working sale

CURRENT: `id`, `sequence`, `lines`, customer concept, subtotal, loyalty redemption, tax included, total, updatedAt.

| Field | Status | Reason |
| --- | --- | --- |
| `fulfillmentMode` | REQUIRED-GAP | authoritative takeaway/dine-in/delivery |
| `salesChannelId` | REQUIRED-GAP | direct vs platform source |
| `priceContextId` / pricelist evidence | REQUIRED-GAP | branch/channel pricing |
| `placeGroupId` | REQUIRED-GAP | advanced local relation |
| `servicePlaceId` | REQUIRED-GAP | exact service place |
| durable open-order ID/status/revision | REQUIRED-GAP | production lifecycle |
| created timestamp | REQUIRED-GAP | audit/elapsed time |
| stable branch/device/employee refs | REQUIRED-GAP | audit and future routing |
| kitchen sent quantities/revisions | REQUIRED-GAP | preparation delta/retry safety |

Current `TicketLine`: `id`, `productId`, `name`, `unitPrice`, `quantity`; line total is DERIVED.

Production TicketLine REQUIRED-GAP:

- selected pricing-option snapshot;
- selected reusable/private add-on snapshots;
- exact effective sold-price source/context;
- discount snapshot/allocation where applicable;
- tax snapshot/allocation where applicable;
- fulfillment/preparation facts where applicable;
- line comment if the approved cashier flow introduces it;
- kitchen sent quantity/revision when preparation exists.

A newly added line uses catalog facts resolved at the time it is added. Later Back Office edits must not silently rewrite a completed receipt.

---

# 5. Restaurant service configuration / open orders

`POS-FLOW-002` uses `RestaurantServiceContract` and current local staging implementation.

These remain **CURRENT-MOCK** product evidence, not final production persistence.

## RestaurantServiceConfig

| Field | Status | Meaning |
| --- | --- | --- |
| `restaurantServiceEnabled` | CURRENT-MOCK / production REQUIRED-GAP | enables restaurant semantics |
| `placeManagementEnabled` | CURRENT-MOCK / production REQUIRED-GAP | enables exact place workflow |

## PlaceGroup

CURRENT-MOCK: `id`, `name`, `places[]`. Current default: exactly one group **الطاولات** with **طاولة 1..6**. Production still needs branch scope, display order, active state and owner/Back Office configuration.

## ServicePlace

CURRENT-MOCK: `id`, `placeGroupId`, `name`. Production active state/order are REQUIRED-GAP; capacity/seats/x/y/shape are not added unless later UI/product scope approves them.

## OpenLocalOrder

CURRENT-MOCK:

- `id`, `commandId`;
- stored Ticket snapshot;
- place-group/place IDs + names;
- `openedAt`, `updatedAt`;
- `kitchenRevision`.

Production requires authoritative open-order status/revision/ownership, safe update/void rules, local persistence, future multi-device coordination and real kitchen dispatch semantics. Do not freeze the mock snapshot as database schema.

---

# 6. Customer / debt / loyalty

## Customer

CURRENT: `id`, `name`, `mobile`, email, address, city, region, postalCode, country, customerCode, optional taxNumber, note and current debt convenience balance.

Current create/edit enforces the local Saudi `05XXXXXXXX` proof rule. Tax-number presence alone is not ZATCA-compliance evidence.

CURRENT executable customer behavior includes search/create/update/attach/remove/profile/purchase history.

## Debt

`DebtLedgerEntry` CURRENT: ID/customer, kind `opening | credit-sale | payment`, direction `debit | credit`, amount, createdAt and related ticket sequence when applicable.

CURRENT executable behavior includes credit sale and debt settlement.

Future permissions, credit limit, due dates, aging, statement export and accounting integration are REQUIRED-GAP/unscoped.

## Loyalty

CURRENT contract/proof meanings include program configuration, customer balance/status, qualifying purchases, redemption quote/applied redemption, loyalty earned and purchase history.

Production eventually needs durable loyalty transaction/audit evidence and owner-managed program policy.

---

# 7. Effective configuration / authorization — MAP-01

This is now an explicit high-priority REQUIRED-GAP because owner-managed policy must be enforceable locally by the cashier POS.

## Owner/Back Office-owned configuration projected to POS

Required durable/effective meanings include:

| Meaning | Status |
| --- | --- |
| branch/device scope | CURRENT identity foundation; effective configuration binding REQUIRED-GAP |
| feature flags (shifts, time clock, open tickets, restaurant/place management, etc.) | REQUIRED-GAP; restaurant flags are CURRENT-MOCK staging only |
| enabled payment methods | REQUIRED-GAP |
| payment-method display order | REQUIRED-GAP |
| tax rules needed for offline sale | REQUIRED-GAP |
| discount definitions/restrictions needed for offline sale | REQUIRED-GAP |
| receipt-print configuration | CURRENT local always-print preference; owner-managed effective config REQUIRED-GAP |
| restaurant groups/places | CURRENT-MOCK staging; owner-managed production config REQUIRED-GAP |
| cashier-visible sale layout scope | CURRENT-MOCK/runtime behavior; final owner/device scope REQUIRED-GAP |

The cashier does not need merchant-management screens for these facts. The POS needs a local effective projection that survives offline operation.

## Employee authorization

CURRENT `EmployeeSession`: `employeeId`, `employeeName`, `roleName`.

REQUIRED-GAP:

- effective permission/capability set;
- store/branch scope;
- permission snapshot/version/effective time where necessary;
- one-action manager override identity;
- approved action/command identity;
- override timestamp and reason/context where required for audit;
- safe local validation while offline.

Role name alone must never be treated as authorization authority.

---

# 8. Shift / cash / time clock — MAP-02

These meanings are REQUIRED-GAP and must be defined before production local-storage freeze because they are first-class cashier operational facts.

## Shift

Target meanings include at least:

- stable `shiftId`;
- branch/device context;
- openedBy employee;
- `openedAt`;
- opening cash amount;
- current/open/closed status;
- closedBy employee;
- `closedAt`;
- expected cash;
- actual/count cash;
- variance;
- totals needed for X/current-shift and close/Z reporting without making report UI the source of truth.

Expected-cash semantics will be based on authoritative cash movements, not a mutable scalar balance.

## Cash movement / drawer ledger

Target meanings include:

- stable movement ID;
- shift ID;
- kind such as opening, sale, refund, pay-in, pay-out, close/count adjustment where product rules permit;
- direction/amount;
- employee/device/timestamp;
- command/idempotency identity;
- note/reason where product flow requires it;
- related sale/refund/payment identity where applicable.

## Time clock

Target meanings remain separate from shift cash accounting:

- employee clock-in/clock-out identity/time;
- active timecard state;
- adjustment/audit rules if owner/manager editing is later approved.

Shifts and time clock may be enabled independently by merchant configuration.

---

# 9. Checkout / payments / settlement — MAP-05

Current checkout includes checkout identity, ticket link, selected method and command/idempotency identity.

Current methods:

- `cash` → **نقدًا** — CURRENT;
- `card` → **شبكة / مدى** — CURRENT-MOCK UX only;
- `credit` → **آجل** — CURRENT customer-credit path.

Cash receipt evidence: `tendered` CURRENT; `change` CURRENT/preserved derived fact.

## Normalized payment record requirement

The current single receipt `paymentMethod` is not sufficient for production split-payment/reconciliation behavior.

REQUIRED-GAP target payment facts include:

- stable `paymentId`;
- sale/receipt/checkout relation;
- payment method identity/type;
- exact amount;
- status/lifecycle;
- command/idempotency key;
- created/authorized/completed/failed/refunded timestamps as applicable;
- employee/device context where needed;
- provider/terminal reference evidence only for integrated methods.

A sale may later have multiple payment records without changing sale identity.

## Production Mada reservation

RESERVED-INTEGRATION: provider/acquirer, terminal ID, external reference, approval/auth reference, RRN when supplied, permitted masked-card reference, scheme/status/provider timestamps and reconciliation/refund evidence.

Never store full PAN, PIN, CVV or track data.

---

# 10. Receipt / refund lifecycle

CURRENT Receipt includes ID/number/payment method convenience value, item snapshots, subtotal/redemption/tax/total, tendered/change/loyalty earned, completion time, employee/branch name snapshots and customer snapshot.

CURRENT executable behavior:

- sale-success receipt;
- receipt list/history (`POS-SCREEN-016`);
- reprint;
- explicit confirmation after `delivery-unknown` before another print attempt;
- email-receipt behavior in the current runtime.

REQUIRED-GAP production additions:

- stable employee/branch/device IDs;
- fulfillment/channel/price-context evidence where applicable;
- selected option/add-on sold snapshots;
- durable payment links;
- receipt-detail lifecycle;
- refund/return identity and line/quantity/amount evidence;
- reason/authorization where required;
- fiscal/cancellation references when ZATCA scope defines them.

Refund is not currently implemented and must not be inferred from receipt existence.

---

# 11. Delivery sales channels / online orders

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

# 12. Device / local node / persistence infrastructure facts

## Device session

CURRENT `DeviceSession`: device ID/name, branch ID/name, linked email.

## Local node context

CURRENT infrastructure facts owned by `LocalPersistenceContract`:

- `installationId` — stable local installation identity;
- `branchId` — branch binding when linked;
- `deviceId` — device binding when linked.

These identities are distinct and must not be collapsed.

## Local snapshots

CURRENT infrastructure facts:

- namespace;
- schemaVersion;
- revision;
- updatedAt;
- module-private snapshot value.

Current private namespaces:

- `pos.runtime`, schema v1;
- `restaurant.service`, schema v1.

Another module must not use another module's private snapshot/table as an integration API.

## Transactional outbox event

CURRENT infrastructure facts:

- stable event `id`;
- versioned `type`;
- `aggregateType` / `aggregateId`;
- `occurredAt`;
- payload;
- contractVersion;
- installation/branch/device context;
- `queuedAt`;
- retry `attempts`;
- `lastAttemptAt`;
- `lastError`.

Current event families include:

- `sale.completed.v1`;
- `ticket.opened.v1`;
- `customer.created.v1`;
- `customer.updated.v1`;
- `customer.credit-charged.v1`;
- `customer.debt-settled.v1`;
- `local-order.opened.v1`;
- `local-order.updated.v1`;
- `local-order.closed.v1`;
- `print.attempted.v1`.

These event shapes may evolve before production contract freeze. Stable identity/idempotency behavior is the invariant; physical local tables are not a Sync/Fiscal/LAN public API.

Current browser local persistence is CURRENT-MOCK/staging transport. Production engine selection is MAP-06.

---

# 13. Printing / kitchen dispatch

Receipt-print UI states CURRENT: `idle`, `queued`, `printed`, `failed`, `delivery-unknown`.

Production print history REQUIRED-GAP: durable job/receipt/printer/device links, status, command identity, timestamps, attempts and safe unknown-delivery evidence. `delivery-unknown` must not cause blind duplicate print.

`POS-FLOW-002` has CURRENT-MOCK `kitchenRevision` proving an advanced local order can be sent, reopened and updated without creating a second open place.

Production kitchen REQUIRED-GAP:

- dispatch ID;
- order/ticket ID;
- fulfillment;
- place when local;
- channel when relevant;
- routed printer/KDS/station;
- revision/version;
- line/void deltas;
- selected option/add-on presentation;
- idempotency/outbox identity;
- delivery state/timestamps.

---

# 14. SKU / barcode status

SKU/barcode is no longer a total data-model gap.

CURRENT-MOCK staging evidence:

- Back Office stores/edits base SKU/barcode;
- duplicate non-empty base identity is rejected by current catalog rules;
- POS staging search resolves fixed-price base item name/SKU/barcode;
- disabling an item removes it from sellable POS search;
- option-priced items stay hidden until explicit cashier option resolution exists.

Still REQUIRED-GAP / hardware proof:

- production scanner transport and keyboard-wedge/device behavior;
- multiple barcodes/option-level sellable identity if product scope requires them;
- barcode standards/normalization policy;
- production persistence;
- branch/cloud propagation;
- import/export.

---

# 15. Current local preferences / staging configuration

CURRENT local preference/proof behavior:

- sale mode `touch | basic`;
- `printReceiptAlways`;
- restaurant service ON/OFF CURRENT-MOCK;
- place management ON/OFF CURRENT-MOCK.

The legacy visible-order-type setting is superseded/hidden in normal current UI.

MAP-01 replaces scattered staging configuration as product authority with a structured Rifad effective-configuration/authorization boundary while preserving useful current behavior.

---

# 16. UI-only state

Do not persist merely because visible:

- dialog/menu open state;
- hover/pressed/animation;
- keypad digits/freshness before command submission;
- temporary numeric input;
- responsive mode;
- old decorative tone;
- scroll position;
- validation CSS state;
- selected service-group tab;
- list presentation state;
- toast/modal visibility;
- current Back Office editor visibility;
- current search/filter text;
- unsaved option/add-on input.

Do not classify merchant-selected category/group/item catalog colors or item image/shape semantics as UI-only; those are CURRENT-MOCK catalog semantics.

---

# 17. Highest-priority production gaps — dependency order

The current roadmap order is:

1. **MAP-01:** structured owner→POS effective configuration and real authorization/manager override meaning;
2. **MAP-02:** shift, cash ledger and time-clock facts;
3. **MAP-03:** POS pricing-option/add-on chooser plus sold-line pricing/discount/tax/fulfillment snapshots;
4. **MAP-04:** full open-ticket/open-order lifecycle and conflict/void/revision semantics;
5. **MAP-05:** normalized payment records, split-ready model, receipt detail and refund lifecycle;
6. **MAP-06:** production local persistence, real migrations, crash recovery and volume;
7. **MAP-07/08/09:** packaged Windows, physical scanner/printer/cash drawer and supported tablet/PWA evidence;
8. **MAP-10:** synchronization re-entry/final adoption using real Rifad operational facts;
9. **MAP-11:** real owner Back Office ↔ cashier POS integration;
10. later verticals: inventory, restaurant admin/KDS/CDS, delivery, fiscal, accounting and other approved capabilities.

Production media asset storage, branch/store product overrides, advanced inventory, delivery mappings, ZATCA and real payment-terminal evidence remain separately governed capabilities; they must not be smuggled into an unrelated map item.

---

# 18. Change-control rule

When visible product work introduces a field/label/option/fulfillment/channel/price/payment/shift/permission fact or restaurant/kitchen state:

1. update this register in the same PR;
2. classify CURRENT / CURRENT-MOCK / REQUIRED-GAP / RESERVED-INTEGRATION / DERIVED / UI-ONLY;
3. update Rifad contracts/models when it becomes authoritative durable business data;
4. update the UI Execution Manifest before behavior implementation where required;
5. add restart/idempotency tests for state that must survive failure/restart;
6. do not wait for SQL design to discover visible business requirements;
7. do not freeze production database shape merely because one UI slice has a staging storage shape;
8. do not let Sync/LAN/Fiscal/ERP read private module persistence as an integration shortcut.
