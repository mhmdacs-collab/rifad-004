# Rifad Current Work Handoff — 2026-08-19 MAP-00 Reconciliation

Status: **CONTINUATION CHECKPOINT — READ FIRST IN A NEW CHAT/CODEX SESSION**

This file summarizes the current product/architecture state and immediate continuation order. Higher-authority decisions remain in `PROJECT_RULES.md` and `docs/architecture/CURRENT_DECISIONS.md`.

---

# 0. Repository / workflow checkpoint

Repository: `mhmdacs-collab/rifad-004`

Active branch: `agent/pos-visual-pass-01`

Pull request: PR #2

Rules:

- keep PR #2 **Draft** and **unmerged** until explicit owner approval;
- before every future write, fetch PR #2 and actual head;
- edit the active branch directly;
- do not assume an older recorded SHA is current;
- run/check applicable Manifest + Back Office + POS verification after implementation changes;
- avoid empty/no-op documentation commits.

---

# 1. Read-first authority

Read in this order:

1. `PROJECT_RULES.md`;
2. `docs/architecture/CURRENT_DECISIONS.md` — especially D-029..D-033;
3. `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`;
4. `docs/MAP_00_REALITY_AUTHORITY_RECONCILIATION.md`;
5. `docs/architecture/RIFAD_ARCHITECTURE.md`;
6. current capability boundaries;
7. `docs/ui/UI_EXECUTION_MANIFEST.json`;
8. `docs/ui/DESIGN_AUTHORITY.md`;
9. `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`;
10. `docs/ui/UI_PROGRESS.md`;
11. this handoff;
12. research as evidence only.

Rifad owns product meanings/contracts. External projects/libraries are donors or adapters, never hidden product authority.

---

# 2. Product/business understanding that must not be lost

Rifad has two primary human contexts that must not be conflated:

## Cashier / branch worker

The cashier works at the branch on the POS and must be able to continue the designated operational day without a live cloud connection. Local-first/offline behavior is product behavior, not an optimization.

Operational POS facts include sales/orders, permitted payment collection, future shift/cash facts, local receipt/print state and restaurant/open-order state where enabled.

## Owner / manager / Back Office user

The owner/admin may be at home or office and uses Back Office for merchant management: products/pricing, feature policy, payment methods, taxes, employee/access policy, branch/device configuration and reports as those families become implemented.

The POS does not need a mirrored administration screen for every owner setting. It needs a local **effective configuration/authorization projection** that can be enforced while offline.

This role split is a core reason MAP-01 precedes shift/refund/payment production behavior.

---

# 3. Current execution sequence — D-033

The earlier sync-first continuation order is no longer current.

D-032's **synchronization behavior and adoption requirements remain binding**, but D-033 supersedes its old immediate sequencing.

The single current roadmap is:

`docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`

Sequence:

1. `MAP-00` reality/authority reconciliation;
2. `MAP-01` effective POS configuration + authorization;
3. `MAP-02` shift + cash drawer ledger + time clock;
4. `MAP-03` complete sold-line truth: pricing options/add-ons/discount/tax/fulfillment snapshots;
5. `MAP-04` complete open-ticket/order lifecycle;
6. `MAP-05` normalized payments + receipt detail + refund lifecycle;
7. `MAP-06` production local persistence behind `LocalPersistenceContract`;
8. `MAP-07` packaged Windows offline/cold-start/crash-recovery proof;
9. `MAP-08` scanner/printer/cash-drawer physical baseline;
10. `MAP-09` supported tablet/PWA local-first proof;
11. `MAP-10` synchronization re-entry/final adoption using real Rifad facts;
12. `MAP-11` real Back Office ↔ POS integration;
13. `MAP-12` later vertical capabilities.

This does **not** mean every future Rifad feature must finish before Sync. The Sync re-entry threshold is the operational cashier core plus production local truth.

Do not resume PowerSync/CouchDB candidate debugging merely because there is existing proof infrastructure. Preserve the evidence; re-enter at MAP-10.

---

# 4. Back Office visual shell

The general Back Office visual-design phase is locked for the current product cycle.

Locked direction:

`Loyverse functional/hierarchy reference → Rifad visual system → compact management shell`

Current shell keeps:

- calm white management surfaces on soft gray;
- fixed RTL right navigation and topbar geometry;
- Rifad green `#0A714E`;
- Cairo-first Arabic typography;
- restrained/no decorative shadows/gradients;
- compact merchant-facing density;
- thin separators;
- one clear Save/Cancel completion area.

Current simplification layer: `apps/backoffice/src/loyverse-reference-pass.css`.

`apps/backoffice/src/backoffice-layout-safety.css` protects shell geometry.

Do not reopen broad styling while implementing features. Visual changes require an explicit owner request, a concrete usability/responsive/accessibility defect or a bounded feature-specific need.

---

# 5. POS current executable state

The POS is **not** a first retail demo. Current executable code includes:

- account/device-link entry;
- employee PIN unlock;
- Arabic RTL/touch product grid;
- Quick Sale/search-first mode;
- catalog/category search;
- cart quantity editing/keypad;
- line delete and Clear Cart;
- editable sale pages: create/rename/delete/move/place/remove;
- inline checkout rail;
- cash payment/change;
- mock Mada/card path;
- success/print preference;
- customer search/create/edit/attach/profile;
- customer purchase history;
- customer credit sale + debt ledger/settlement proof;
- loyalty status/redemption/earning proof;
- receipt list/history, email behavior and reprint;
- restaurant service OFF/simple/advanced local-service prototype;
- generic `PlaceGroup → ServicePlace`;
- current default group `الطاولات` with `طاولة 1..6`;
- open local order create/reopen/update/send/close proof;
- mock kitchen revision behavior;
- shared catalog reader boundary;
- Rifad local-persistence/outbox journal around current POS/restaurant state.

MAP-00 corrected `ReceiptsScreen` stable identity from the erroneous `POS-SCREEN-012` to its reserved `POS-SCREEN-016`.

Important non-claims:

- no production time clock;
- no shift/cash drawer accounting;
- no effective permission matrix/manager override;
- no POS pricing-option/add-on chooser;
- no complete sold-line discount/tax/fulfillment snapshots;
- no full general open-ticket list/reopen/move/merge/split lifecycle;
- no normalized multi-payment/split-payment model;
- no receipt-detail/refund lifecycle;
- no real terminal integration;
- no production ZATCA;
- no real printer/KDS/CDS transport;
- no production delivery connector;
- no production local database;
- no production branch/cloud synchronization.

---

# 6. POS runtime / model boundaries

Current aggregate `PosRuntimeContract` includes:

- device session;
- employee session;
- catalog;
- sale layout;
- sales;
- customer credit;
- loyalty;
- checkout;
- receipts;
- printing.

The composition root injects the implementation; UI/state does not own a donor/backend SDK.

Current `TicketLine` still lacks production selected-option/add-on/discount/tax/fulfillment snapshots.

Current `Receipt` still carries one payment-method convenience value, so MAP-05 must introduce split-ready durable payment records before production freeze.

Current `EmployeeSession` carries role name but not an effective authorization set. Shift/cash models do not exist yet.

---

# 7. Local persistence / outbox state

`LocalPersistenceContract` is already a Rifad-owned boundary and remains separate from Sync/LAN/Fiscal.

Current foundation includes:

- stable `installationId`;
- branch/device context;
- private versioned snapshots/revisions;
- snapshot + event commit semantics;
- stable event identity/dedup;
- retry/failure bookkeeping;
- acknowledgement.

Current private namespaces:

- `pos.runtime` schema v1;
- `restaurant.service` schema v1.

Current staging events include:

- `sale.completed.v1`;
- `ticket.opened.v1`;
- customer create/update/credit/debt events;
- local-order open/update/close events;
- `print.attempted.v1`.

Current browser storage proves clean runtime reconstruction of key POS/restaurant state. It **does not** prove production crash atomicity, volume, packaged Windows behavior or final local database choice.

Do not add Sync/LAN/Fiscal just to complete the local database gate.

---

# 8. Back Office / catalog current executable model

Current executable destinations:

- `قائمة الأصناف`;
- `الفئات`;
- `مجموعات الخيارات`;
- `الإضافات`.

Current catalog meanings include:

- name/description/category;
- base SKU/barcode;
- available-for-sale;
- fixed price;
- reusable pricing-option groups;
- inherited group prices;
- sparse per-item price overrides;
- item-private pricing choices;
- reusable general add-ons;
- item-private add-ons;
- category/option/add-on accent colors;
- item appearance by color/shape or image staging.

Merchant pricing intentionally uses reusable **مجموعات الخيارات** rather than forcing technical Cartesian variants.

Current browser catalog staging schema is **v4**.

`imageDataUrl` is staging transport only. Production media storage/sync remains unselected.

Current POS deliberately hides option-priced items until an approved cashier option/add-on chooser exists, preventing silent fallback/minimum-price selling.

Other Back Office families — reports/inventory/employees/permissions/customers/settings/payment types/taxes/etc. — remain mapped rather than executable.

---

# 9. Restaurant / fulfillment / channel meanings

Restaurant service and advanced place management are separate configuration layers.

Current prototype defaults:

- one group `الطاولات`;
- `طاولة 1..6`;
- free `متاحة`;
- occupied/open `محجوزة`;
- `إرسال` separate from `دفع`;
- current kitchen behavior is mock only.

Persistent group/place configuration belongs primarily in Back Office later.

Keep these durable meanings separate:

- fulfillment: takeaway / dine-in / delivery;
- sales channel: direct POS / delivery platform / future source;
- payment/collection/settlement: cash/Mada/customer credit/platform prepaid/due on delivery/settlement.

Do not collapse them into one `orderType` or payment-method field.

---

# 10. Immediate product-model work after MAP-00

## MAP-01 — Effective configuration + authorization

Define the Rifad-owned contract/local projection for:

- feature flags needed by POS;
- enabled payment methods and order;
- tax/discount policy needed for offline sale;
- branch/device scope;
- employee effective permissions;
- manager one-action override/audit semantics;
- receipt/restaurant settings needed locally.

Owner/Back Office is the source of policy; POS consumes an effective local projection.

## MAP-02 — Shift/cash/time clock

Define and implement real cashier-day facts:

- open shift + opening cash;
- current shift;
- pay in/out;
- cash sales/refunds linkage;
- expected vs actual cash;
- close shift/report facts;
- separate time-clock state when enabled.

## MAP-03 — Complete sold-line truth

Implement pricing-option/add-on chooser and durable sold snapshots before production local DB freeze.

## MAP-04/05

Complete open-ticket/order lifecycle plus normalized payment/receipt/refund lifecycle.

Only then proceed to production local persistence adoption.

---

# 11. Synchronization evidence — preserved, paused

Existing synchronization proofs remain under:

- `tests/sync-candidates/couchdb/`;
- `tests/sync-candidates/powersync/`;
- `tests/sync-candidates/powersync-web/`;
- `tests/sync-candidates/powersync-windows/`;
- related workflows and `docs/research/sync/` evidence.

They include useful candidate evidence for propagation, offline/reconnect/restart, ambiguous retry/idempotency, additive schema evolution, Windows/native and browser/PWA-class paths, and permission/isolation scenarios.

No synchronization technology is production-selected.

PowerSync client/open-service licensing/topology questions and all remaining operational/security/production gates stay recorded for MAP-10. Do not turn prior investment into an adoption decision.

Keep separate:

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA`

No Branch Hub/LAN implementation is authorized.

---

# 12. Manifest / traceability checkpoint

MAP-00 reconciles already-existing code with the manifest instead of pretending it does not exist.

Important corrections include:

- `POS-SCREEN-006` records existing customer/credit/loyalty behavior while denying unreviewed future expansion;
- `POS-SCREEN-009` records existing **mock** card UX without claiming integrated terminal support;
- `POS-SCREEN-016` records existing receipt list/reprint and owns the correct stable screen ID;
- `POS-SCREEN-026` records existing page rename/move/delete in addition to create/place/remove;
- Back Office notes reflect current category/group colors and item appearance;
- `BO-FLOW-002` names BrowserCatalog schema v4.

Every future visible durable field still requires Field Register + Manifest discipline before/with implementation.

---

# 13. Do-not-claim list

Do not claim production readiness for:

- production local DB;
- synchronization technology selection;
- branch/cloud synchronization;
- LAN/Branch Hub;
- real Mada/card terminal;
- ZATCA/Fatoora production integration;
- real KDS/printer/CDS dispatch;
- restaurant multi-device locking;
- delivery-platform connectors;
- accounting integration;
- production media storage/sync;
- final database schema.

The Back Office visual reference/shell is locked; this is not a claim that every future feature-specific screen is pixel-frozen or already implemented.

---

# 14. Communication / implementation preference

- Keep product discussion concise and focused until direction is clear.
- Before implementation, understand the whole Rifad dependency/context rather than optimizing one isolated screen/technology.
- When implementation is explicitly requested, edit the branch directly rather than dumping code into chat.
- Research mature reusable capabilities before building substantial infrastructure from zero; open-source/permissive fit and source adaptability matter.
- Managed infrastructure is acceptable when it is infrastructure, but providers must not silently own Rifad's product contracts/domain truth.
- Do not merge PR #2 without explicit approval.
- Do not let external providers own Rifad's domain.
- If an owner request conflicts with higher-authority product/technical facts, say so and explain the conflict rather than reflexively agreeing.
