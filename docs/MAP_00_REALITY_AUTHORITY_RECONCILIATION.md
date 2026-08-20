# MAP-00 — Rifad Reality and Authority Reconciliation

Status: **EXECUTION RECORD — MAP-00**

Date: 2026-08-19

Repository: `mhmdacs-collab/rifad-004`

Active branch: `agent/pos-visual-pass-01`

Pull request: PR #2 — keep **Draft** and **unmerged** until explicit owner approval.

---

## 1. Why this reconciliation exists

Rifad has moved faster than several of its continuation documents. The executable POS, Back Office catalog, local-persistence foundation and automated tests now contain behavior that older manifests/handoffs still describe as mapped, partial or future work. At the same time, some executable paths remain deliberate UI proofs or staging transports and must not be promoted into production claims merely because code exists.

MAP-00 reconciles those two risks:

1. **under-reporting real Rifad work**, which makes future sessions behave as if the product were less complete than it is; and
2. **over-claiming staging/mock work**, which would freeze temporary shapes or infrastructure as product authority.

No new business feature is introduced by MAP-00. This record describes the product that already exists and the exact dependency order approved for the next cycle.

---

## 2. Binding product identity

Rifad is an independent Saudi POS product. It is not an Odoo skin, a FloCafe continuation or a fork whose donor owns the product model.

The fixed architectural relationship is:

```text
Rifad product UI/domain
        ↓
Rifad-owned contract
        ↓
replaceable adapter / Rifad implementation
        ↓
local store / donor slice / external service / cloud as appropriate
```

Loyverse remains the primary **functional/workflow/ergonomic baseline**, not a source-code or internal-technology authority. Its observable cashier/owner behavior is useful; its proprietary internal storage/synchronization implementation is unknown and must not be invented.

Rifad may use managed infrastructure where operationally sensible, but infrastructure does not become product-domain authority. Core capabilities are evaluated according to the Capability Adoption Workflow: bounded capability, Rifad contract, multiple credible implementations for substantial work, real source/tests/failure inspection, licensing, smallest proven slice, conformance and replaceability.

---

## 3. Human/product roles

### 3.1 Cashier / branch worker

The POS is the operational surface for the worker in the branch. Its core job is to remain usable when internet connectivity is unavailable for workflows that are designated offline-capable.

The cashier should be able to perform the permitted branch-day operations from local state: identify/unlock, sell, manage the active/open order, collect permitted payments, handle the shift/cash lifecycle once implemented, print locally where hardware permits, and continue after application restart.

The cashier is **not** the default authority for merchant-wide configuration. Product/payment/tax/feature/permission configuration may be projected locally so the POS can enforce it without requiring a live cloud connection.

### 3.2 Owner / manager / Back Office user

Back Office is the management surface. It owns or administers merchant configuration such as products, pricing structures, available payment methods, employee/permission policy, taxes, feature configuration, branch/POS-device settings and reporting domains as those capabilities are implemented.

Back Office does not need an offline cashier operating model. Its current browser catalog persistence is staging evidence for product discovery, not the intended production topology.

### 3.3 Consequence for future synchronization

Not every Back Office capability has a mirrored cashier-management screen. The POS needs the **effective local projection** required for work.

Example:

```text
Owner enables Cash + Mada for Branch A
          ↓
future cloud/config publication
          ↓
POS local effective configuration
          ↓
Cashier sees only Cash + Mada
```

Conversely, operational facts such as a shift, cash movement or finalized sale originate at the POS and later become visible to the owner.

---

## 4. Current executable POS reality

The current POS is already a substantial touch-first application, not a first-screen demo.

### 4.1 Entry and runtime composition

Current executable composition uses:

- `createPosRuntimeAdapter()` behind `PosRuntimeContract`;
- `createRestaurantServiceAdapter()` behind `RestaurantServiceContract`;
- `createLocalPersistenceAdapter()` behind `LocalPersistenceContract`;
- dependency injection into `usePosFlow` and `useLocalServiceFlow`.

Concrete mocks/staging transports are selected at composition roots. UI/state code does not own donor/provider implementations.

### 4.2 Implemented cashier behavior

Current code and tests include:

- account/device-link sign-in shell;
- four-digit employee PIN unlock;
- Arabic RTL touch-first sales workspace;
- touch sale pages plus Quick Sale/search-first mode;
- category/catalog loading and product search;
- whole product-card addition;
- quantity editing including embedded keypad and large quantities;
- line removal and Clear Cart behavior;
- sale-page create, rename, delete, reorder/move, product placement and removal;
- customer search, create, edit, attach/remove and profile presentation;
- Saudi local mobile-number validation in the current customer flow;
- customer purchase history;
- customer credit sale and debt ledger/settlement proof;
- loyalty status, redemption quote/application, earning and purchase linkage;
- checkout continuity that keeps catalog spatial context;
- cash selection, exact/over tender and change;
- mock card/Mada UX and mock card completion;
- sale-success state;
- email-receipt behavior in the current runtime;
- receipt history and reprint, including `delivery-unknown` confirmation behavior;
- restaurant service OFF / simple local / advanced place-management behavior;
- generic `PlaceGroup → ServicePlace` model;
- current default `الطاولات` group with six places;
- open local order create/reopen/update/send/close flow;
- mock kitchen revision behavior;
- release of the occupied place after successful settlement;
- staging cold-restart reconstruction through the Rifad local-persistence namespace;
- transactional outbox/event journaling for current durable mutations.

### 4.3 Important POS non-claims

Current executable code does **not** prove:

- production employee identity/permission backend;
- time clock;
- shift lifecycle and cash drawer accounting;
- complete permission matrix or one-action manager override;
- POS pricing-option/add-on chooser;
- durable discount/tax/fulfillment sold-line snapshots;
- complete general open-ticket list/reopen/move/merge/split/bill lifecycle;
- normalized multi-payment/split-payment records;
- receipt-detail/refund lifecycle;
- real Mada/payment-terminal integration;
- production ZATCA/Fatoora;
- production local database;
- packaged Windows crash/cold-start guarantees;
- production cloud synchronization;
- multi-device restaurant locking/conflict handling;
- real printer/KDS/CDS transports;
- production delivery connectors.

---

## 5. Current POS contract/data reality

### 5.1 `PosRuntimeContract`

The aggregate runtime currently composes:

- `DeviceSessionContract`;
- `EmployeeSessionContract`;
- `CatalogContract`;
- `SaleLayoutContract`;
- `SalesContract`;
- `CustomerCreditContract`;
- `LoyaltyContract`;
- `CheckoutContract`;
- `ReceiptsContract`;
- `PrintingContract`.

The current contract therefore already represents much more than the original retail cash slice.

### 5.2 Current durable model gaps

Current `TicketLine` is still fundamentally:

`product + name snapshot + unit price + quantity`.

It does not yet carry the production truth needed for selected pricing options, add-ons, discounts, taxes, fulfillment, price context or preparation deltas.

Current `Receipt` uses one `paymentMethod` value (`cash | card | credit`). That is sufficient for the current proof but cannot be the final split-payment-ready model.

Current `EmployeeSession` carries a role name but no effective capability set. Current models do not yet contain shifts/cash movements.

These are product-model gaps and are intentionally scheduled before production local-database freeze.

---

## 6. Current Back Office reality

Back Office is not an empty future surface. The current locked shell contains one real bounded catalog-management family.

### 6.1 Executable catalog family

Current `BO-FLOW-002` behavior includes:

- item list;
- search by name/SKU/barcode;
- category filtering;
- add/edit item;
- name/description/category/SKU/barcode;
- available-for-sale state;
- fixed price;
- reusable pricing option groups;
- inherited group prices;
- sparse item-specific overrides;
- item-private pricing choices;
- reusable general add-on groups;
- item-private add-ons;
- category creation/rename and merchant-selected accent color;
- option-group creation/edit and accent color;
- add-on-group creation/edit and accent color;
- item POS appearance by color/shape or image staging;
- explicit Save/Cancel workflow.

### 6.2 Catalog boundary

Back Office and POS share Rifad catalog meaning through `CatalogAdminContract` / `CatalogReadContract`, not by reading each other's UI state.

Current browser catalog transport is `BrowserCatalogAdapter`; the current staging snapshot schema version is **4**. Its browser storage and `imageDataUrl` media representation are explicitly temporary transports, not production storage design.

Option-priced items remain hidden from the normal POS reader until the cashier option chooser exists. This is an intentional safety rule so a minimum/convenience price is never sold as if it were the selected price.

### 6.3 Other Back Office families

Reports, inventory, employees/permissions, customers, settings, payment types, taxes, restaurant configuration and other management families are mapped/researched but are not currently executable production capabilities.

The visual shell is locked for the current cycle; future capability-specific UI inherits it rather than reopening broad styling.

---

## 7. Current local-first persistence reality

`LocalPersistenceContract` V1 is a Rifad-owned boundary and remains separate from Sync/LAN/Fiscal.

Current durable infrastructure facts include:

- stable `installationId`;
- independent `branchId` and `deviceId` binding;
- module-private snapshot namespace;
- snapshot `schemaVersion` and `revision`;
- snapshot + event commit semantics;
- stable event ID/type/aggregate identity;
- event occurrence/queue timestamps;
- retry attempt count, last-attempt time and last error;
- acknowledgement/removal after downstream confirmation.

Current private namespaces are:

- `pos.runtime` schema v1;
- `restaurant.service` schema v1.

Current staging event families include:

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

Current browser-storage reconstruction proves the Rifad namespace can restore device/employee/ticket/customer/receipt/open-local-order state after clean reconstruction. It does **not** prove OS crash atomicity, production volume, Windows installer behavior, multi-process locking or final database choice.

---

## 8. Restaurant, channel and payment meaning separation

Rifad deliberately keeps three facts separate:

1. **Fulfillment** — takeaway / dine-in / delivery;
2. **Sales channel** — direct POS / delivery platform / future source;
3. **Payment/collection/settlement** — cash, local card, customer credit, platform prepaid, due on delivery, later settlement.

The current restaurant prototype must not collapse these into one old `orderType` field. Persistent branch groups/places belong primarily to future Back Office configuration. Kitchen dispatch remains its own lifecycle and must eventually use durable revision/delta/idempotency semantics.

---

## 9. UI/manifest drift found by MAP-00

The audit found specific documentation drift that must be corrected rather than ignored:

1. `ReceiptsScreen.tsx` used `POS-SCREEN-012`, while the manifest reserves that ID for **Save Open Ticket** and reserves `POS-SCREEN-016` for **Receipts List**. MAP-00 corrects the executable metadata to `POS-SCREEN-016`; IDs are not reused.
2. `POS-SCREEN-006 Customer and Loyalty` is still listed as mapped although current customer/credit/loyalty behavior and tests exist.
3. `POS-SCREEN-009 Integrated Payment` is listed as mapped although a **mock card UX** is executable. It must be recorded as implemented mock behavior without implying terminal integration.
4. `POS-SCREEN-016 Receipts List` is listed as mapped although the executable receipts screen/history/reprint path exists.
5. `POS-FLOW-006` documentation still lists rename/reorder/delete as non-goals although the current `SaleLayoutContract`, state flow and UI expose them.
6. Back Office manifest notes still under-report current catalog visual identity and category/group colors.
7. `BO-FLOW-002` still names BrowserCatalog schema v3 although current catalog schema is v4.
8. `UI_PROGRESS.md` still describes Back Office as a future/empty surface and under-reports staging SKU/barcode identity.
9. Continuation documents still describe synchronization as the immediate gate despite the owner-approved dependency map now placing operational POS completeness and production local persistence first.

These are documentation/identity corrections; they do not authorize unimplemented product features.

---

## 10. Synchronization evidence and its correct status

Existing synchronization research/proofs are preserved. They are not deleted or declared worthless.

However:

- no synchronization provider is production-selected;
- PowerSync is not product authority;
- current candidate proof schemas are not Rifad business schema;
- additional sync adoption/debugging is paused until the POS operational domain and production local persistence are sufficiently complete;
- Sync remains a high-risk replaceable adapter capability and must still satisfy the Capability Adoption Workflow, legal fit, platform tests, security and operational evidence when MAP-10 reopens it.

This prevents sunk-cost pressure from turning an experimental candidate into architecture.

---

## 11. Reconciled execution order

The authoritative execution roadmap for this cycle is `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`.

The dependency order is:

```text
MAP-00 reality/authority reconciliation
   ↓
MAP-01 effective POS configuration + authorization
   ↓
MAP-02 shift + cash ledger + time clock
   ├─────────────┐
   ↓             ↓
MAP-03 complete sale-line truth
   ↓
MAP-04 open-ticket/order lifecycle
MAP-05 payment/receipt/refund lifecycle
   ↓
MAP-06 production local persistence
   ↓
MAP-07 Windows offline/cold-start/crash proof
MAP-09 tablet/PWA local-first proof
   ↓
MAP-10 synchronization re-entry/final adoption
   ↓
MAP-11 real Back Office ↔ POS integration
   ↓
MAP-12 later vertical capabilities
```

MAP-08 physical scanner/printer/cash-drawer proof follows the Windows local runtime gate and remains separate from real integrated terminal adoption.

The purpose is not to finish every possible Rifad feature before Sync. The Sync re-entry gate is reached when the **cashier operational core and its production local truth are real enough that synchronization carries actual Rifad facts rather than proof-only tables.**

---

## 12. What MAP-00 may change

MAP-00 may change only documentation/metadata needed to make repository authority match existing executable reality:

- screen/action/flow identity/status descriptions;
- UI progress descriptions;
- field-register classification;
- continuation sequencing;
- current decision sequencing;
- PR continuation description;
- obvious wrong stable-ID metadata in existing code.

MAP-00 does **not** implement shifts, permissions, options/add-ons, refunds, production database, hardware or Sync.

---

## 13. MAP-00 exit gate

MAP-00 is PASS only when all of the following are true:

- `UI_EXECUTION_MANIFEST.json` reflects the current executable surface without production over-claims;
- `UI_PROGRESS.md` reflects current POS + Back Office reality;
- `POS_UI_NAMING_AND_FIELD_REGISTER.md` captures existing durable meanings plus the high-priority missing meanings driving MAP-01..05;
- current decisions/documentation no longer direct a new session to resume synchronization before the operational/local-persistence gates;
- `ReceiptsScreen` uses its correct stable screen ID;
- PR #2 remains Draft and unmerged;
- no new product behavior was introduced during reconciliation.
