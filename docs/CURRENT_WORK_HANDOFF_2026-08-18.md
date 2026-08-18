# Rifad Current Work Handoff — 2026-08-18

Status: **CONTINUATION CHECKPOINT — READ FIRST IN A NEW CHAT/CODEX SESSION**

This file summarizes the current product/architecture state and the immediate continuation order. Higher-authority decisions remain in `PROJECT_RULES.md` and `docs/architecture/CURRENT_DECISIONS.md`.

---

# 0. Repository / workflow checkpoint

Repository: `mhmdacs-collab/rifad-004`

Active branch: `agent/pos-visual-pass-01`

Pull request: PR #2

Rules:

- keep PR #2 **Draft** and **unmerged** until explicit owner approval;
- before every future write, fetch PR #2 and actual head;
- edit the active branch directly;
- do not assume the SHA recorded in an older chat/document is current;
- run/check applicable Manifest + Back Office + POS verification after implementation changes;
- avoid empty/no-op documentation commits.

---

# 1. Read-first authority

Read in this order:

1. `PROJECT_RULES.md`;
2. `docs/architecture/CURRENT_DECISIONS.md`;
3. `docs/architecture/RIFAD_ARCHITECTURE.md`;
4. current capability boundaries, especially `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`;
5. `docs/ui/UI_EXECUTION_MANIFEST.json`;
6. `docs/ui/DESIGN_AUTHORITY.md`;
7. `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`;
8. this handoff;
9. research as evidence only.

Rifad owns product meanings/contracts. External projects/libraries are donors or adapters, never hidden product authority.

---

# 2. Owner workflow / execution rule

The owner clarified two critical working rules.

## 2.1 Visual reference lock first

For surfaces using Loyverse as the approved reference, do not repeatedly alternate between visual redesign and feature invention.

The intended workflow is:

`Loyverse reference → reproduce hierarchy/spacing/interaction closely → owner visual sign-off → then add Rifad improvements deliberately`

For the current Back Office this means simplicity over decorative redesign: calm white surfaces, soft gray workspace, restrained typography, thin separators, minimal shadows, stable RTL navigation, compact administrative density and one clear completion area.

Current latest simplification layer: `apps/backoffice/src/loyverse-reference-pass.css` loaded last.

Final Back Office visual acceptance is still pending.

## 2.2 Do not reinvent solved infrastructure

Before implementing substantial infrastructure from zero:

- define the bounded Rifad capability/contract;
- search multiple credible existing implementations;
- run/characterize them;
- inspect source/tests/failures where available;
- verify license/dependencies/distribution obligations;
- reuse/port/adapt the smallest proven slice behind Rifad-owned boundaries.

This is mandatory under `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`.

---

# 3. Current strategic priority — synchronization sequencing corrected

The earlier handoff wording postponed deep synchronization until after most product-field discovery. That was too broad and is superseded by D-030 + D-032.

The correct distinction is:

- **final production business/database model freeze still waits for sufficient product/UI durable-field discovery;**
- **synchronization selection/proof should happen earlier, once the current POS/Back Office visual shell is locked enough to stop visual churn.**

Why: Back Office exists to control/manage the product that POS actually runs. A Back Office that adds an item, price, option group, table setting or permission but cannot propagate it to POS is still only a disconnected UI proof.

Current intended sequence:

1. lock current Loyverse-reference visual shell enough to stop repeated styling churn;
2. execute synchronization candidate proofs;
3. adopt one replaceable schema-tolerant synchronization capability;
4. connect Back Office ↔ POS through that real path;
5. continue product features/field discovery end-to-end through synchronization;
6. freeze mature production domain/data model later.

Read:

- `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`;
- `docs/research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md`.

No synchronization technology is selected yet.

---

# 4. Synchronization behavior now required

Loyverse is the behavioral baseline, not a proprietary technology donor.

Official Loyverse documentation currently shows:

- Back Office/POS online changes propagate in real time/quickly;
- new items/categories can appear across connected devices and Back Office;
- offline receipts are stored locally as unsynchronized and automatically sync after reconnect;
- manual sync exists as fallback;
- open tickets synchronize across online POS devices in the same store;
- permissions decide which POS actions/users may modify protected business data.

Rifad therefore requires:

- automatic/continuous connected synchronization by default;
- durable offline-capable local POS facts and automatic reconnect replay;
- stable identity/idempotency so retry never duplicates a finalized sale/payment/order fact;
- permissions/domain authority separate from replication direction;
- manual Sync/status only as fallback/diagnostic/user-confidence affordance;
- schema/feature growth handled by normal schema/configuration evolution, **not a new sync engine per feature**;
- actual Windows + tablet/PWA proof before production selection;
- future branch-local/LAN capability must remain possible, but Branch Hub is **not** authorized just because sync work starts.

Current candidate research includes PowerSync, Apache CouchDB replication and Couchbase Lite/Sync Gateway as high-value proof candidates with different unresolved platform/license/topology tradeoffs. Documentation is not enough to pick a winner.

---

# 5. Core architecture already established

## Rifad-owned adapter model

`Rifad UI/domain → Rifad contract → replaceable adapter → external/local implementation`

Important current boundaries:

- `PosRuntimeContract`;
- `RestaurantServiceContract` with `PlaceGroup → ServicePlace → OpenLocalOrder`;
- `CatalogAdminContract` / `CatalogReadContract`;
- `LocalPersistenceContract`;
- synchronization boundary now defined separately in `SYNC_CAPABILITY_BOUNDARY.md`.

Provider schemas/IDs/SDK errors/credentials stop at adapters.

## Local persistence

Current local persistence foundation includes:

- stable installation identity;
- branch/device context;
- versioned module-private snapshots;
- revision metadata;
- transactional outbox;
- stable event identity/deduplication;
- retry/failure bookkeeping;
- acknowledgement.

Current browser storage/localStorage compatibility is staging only, not final Windows/PWA production database selection.

Keep these separate:

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA`

---

# 6. POS current product state

Current POS prototype includes substantial Arabic RTL/touch interaction work:

- product grid and Quick Sale/search-first mode;
- cart quantity editing/keypad;
- inline checkout rail;
- cash flow with quick amounts/change/`سداد`;
- mock Mada/card path;
- success/print preference;
- customer selection/creation and debt/credit proof;
- stable transaction action geometry;
- restaurant local-service prototype;
- shared catalog reader boundary.

Important non-claims:

- no real terminal integration;
- no production ZATCA;
- no real KDS/printer transport;
- no production delivery connector;
- no production local database;
- no production branch/cloud synchronization yet.

Current POS still lacks approved pricing-option/add-on chooser and sold-line option/add-on snapshots.

---

# 7. Restaurant / delivery product meanings

Restaurant service and advanced place management are separate configuration layers.

Current prototype defaults:

- one group `الطاولات`;
- `طاولة 1..6`;
- free `متاحة`;
- occupied/open `محجوزة`;
- `إرسال` separate from `دفع`;
- current kitchen behavior is mock only.

Persistent group/place configuration belongs primarily in Back Office later.

Fulfillment, sales channel and payment/collection/settlement remain distinct durable concepts.

Preferred future delivery cashier UX: one `طلبات أونلاين` queue with multiple direct/aggregator adapters behind it. Current delivery work is research/design only.

---

# 8. Back Office / catalog current model

Current executable catalog destinations:

- `قائمة الأصناف`;
- `الفئات`;
- `مجموعات الخيارات`;
- `الإضافات`.

Current item/catalog meanings include:

- name/description/category;
- fixed price;
- SKU/barcode;
- available-for-sale;
- merchant visual representation;
- pricing policy;
- reusable/general add-ons;
- item-private add-ons.

## Multiple pricing

Merchant UX intentionally uses reusable **مجموعات الخيارات** rather than forcing technical Cartesian variants.

Example: `أحجام البيتزا → صغير 10 | وسط 20 | كبير 25`.

An item can use:

1. fixed price;
2. shared group with inherited prices;
3. shared group with sparse item-specific overrides;
4. item-private direct options.

Sparse override means unchanged values continue inheriting the shared group.

## Visual catalog identity

Current browser catalog staging schema is v4 and carries:

- item appearance mode `color | image`;
- item color/shape/image staging semantics;
- category color;
- option-group color;
- reusable add-on-group color.

`imageDataUrl` is staging transport only. Production media storage/sync remains unselected.

Current cashier POS still does **not** render this appearance contract yet.

---

# 9. Back Office visual continuation

Primary owner-supplied Loyverse screenshots are a direct structural/interaction reference.

Avoid repeating earlier over-design mistakes:

- giant headings/empty margins;
- nested card-inside-card layouts;
- gradients/heavy shadows;
- oversized preview surfaces;
- repeated Save/Cancel zones;
- visual CSS that changes shell geometry;
- adding complexity merely to appear modern.

`backoffice-layout-safety.css` protects fixed topbar/sidebar geometry after an earlier polish layer broke layout flow.

Current CSS load direction keeps `loyverse-reference-pass.css` last to flatten/decorate less.

Evaluate at normal 1920×1080 viewing distance. Cairo-first Arabic typography remains the direction without mandatory remote-font dependency.

---

# 10. Known gaps after synchronization gate

Product gaps still include:

- final Back Office visual acceptance;
- POS option/add-on chooser + sold snapshots;
- add-on required/min/max rules;
- cost/inventory/low-stock/tax/weight/composite flows;
- branch/store product overrides;
- delete/reorder/import/export/permissions;
- Back Office restaurant groups/places/settings;
- delivery/channel administration;
- employee/permission management;
- production media storage/sync;
- final production local/cloud database selection;
- branch/LAN topology;
- production fiscal/payment/KDS/delivery connectors.

These should be discovered/implemented in bounded vertical slices, increasingly through the real synchronization path once it is adopted.

---

# 11. Do-not-claim list

Do not claim production readiness for any of the following without new runtime evidence:

- synchronization technology selection;
- branch/cloud synchronization;
- LAN/Branch Hub;
- production local DB;
- real Mada/card terminal;
- ZATCA/Fatoora production integration;
- real KDS/printer dispatch;
- restaurant multi-device locking;
- delivery-platform connectors;
- accounting integration;
- production media storage/sync;
- final database schema;
- final Back Office visual acceptance.

---

# 12. Communication / implementation preference

- Keep product discussion concise and focused until direction is clear.
- When implementation is explicitly requested, edit the branch directly rather than dumping code into chat.
- Do not invent a technology/version ladder when a mature reusable capability may already exist; research first.
- Do not merge PR #2 without explicit approval.
- Do not let external providers own Rifad's domain.
