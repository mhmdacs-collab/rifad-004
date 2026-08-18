# Rifad Current Work Handoff — 2026-08-18

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
2. `docs/architecture/CURRENT_DECISIONS.md`;
3. `docs/architecture/RIFAD_ARCHITECTURE.md`;
4. current capability boundaries, especially `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`;
5. `docs/ui/UI_EXECUTION_MANIFEST.json`;
6. `docs/ui/DESIGN_AUTHORITY.md`;
7. `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`;
8. `docs/ui/visual-decisions/VISUAL-DECISION-007-BACK-OFFICE-LOYVERSE-HIERARCHY.md`;
9. this handoff;
10. research as evidence only.

Rifad owns product meanings/contracts. External projects/libraries are donors or adapters, never hidden product authority.

---

# 2. Owner workflow / execution rules

## 2.1 Back Office visual shell is now locked

On 2026-08-18 the owner explicitly closed the general Back Office visual-design phase for the current product cycle.

The locked workflow is:

`Loyverse reference → reproduce hierarchy/spacing/interaction closely → visual shell lock → build Rifad capabilities deliberately`

The current Back Office therefore keeps:

- calm white management surfaces on soft gray;
- fixed RTL right navigation and fixed topbar geometry;
- Rifad green `#0A714E`;
- Cairo-first Arabic typography;
- restrained/no shadows and no decorative gradients in ordinary administration;
- compact merchant-facing density;
- thin separators;
- one clear Save/Cancel completion area;
- compact product/POS representation controls.

Current simplification layer: `apps/backoffice/src/loyverse-reference-pass.css` loaded last.

`apps/backoffice/src/backoffice-layout-safety.css` protects shell geometry.

Do not reopen broad styling while implementing features. Visual changes now require an explicit owner request, a concrete usability/responsive/accessibility defect, or a bounded feature-specific need.

See `VISUAL-DECISION-007`.

## 2.2 Do not reinvent solved infrastructure

Before implementing substantial infrastructure from zero:

- define the bounded Rifad capability/contract;
- search multiple credible existing implementations;
- execute/characterize them;
- inspect source/tests/failure behavior where available;
- verify license/dependencies/distribution obligations;
- reuse/port/adapt the smallest proven slice behind Rifad-owned boundaries.

This is mandatory under `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`.

---

# 3. Immediate priority — synchronization candidate proof

The visual-shell prerequisite in D-032 is now satisfied.

**The next infrastructure gate is synchronization candidate execution/adoption.**

The distinction remains:

- final production business/database model freeze waits for sufficient product/UI durable-field discovery;
- synchronization must be selected/proved earlier so Back Office and POS stop behaving as disconnected demos.

Current sequence:

1. **DONE:** lock current Loyverse-reference Back Office visual shell;
2. **NEXT:** execute synchronization candidate proofs;
3. adopt one replaceable, schema-tolerant synchronization capability;
4. connect Back Office ↔ POS through that real path;
5. continue product features/field discovery end-to-end through synchronization;
6. freeze mature production domain/data model later.

Read:

- `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`;
- `docs/research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md`.

No synchronization technology is selected yet.

---

# 4. Synchronization behavior required

Loyverse is the behavioral baseline, not a proprietary technology donor.

Rifad requires:

- automatic/continuous connected synchronization by default;
- Back Office changes reaching relevant POS clients quickly;
- permitted POS changes and operational facts reaching Back Office/cloud and relevant clients quickly;
- durable offline-capable POS facts and automatic reconnect replay;
- stable identity/idempotency so retry never duplicates finalized sale/payment/order facts;
- permissions/domain authority separated from replication direction;
- manual Sync/status only as fallback/diagnostic/user-confidence affordance;
- ordinary schema/feature growth handled through normal schema/configuration evolution, not a new sync engine per feature;
- actual Windows + tablet/PWA proof before production selection;
- iPad support where the selected practical path proves it;
- future branch-local/LAN capability remaining possible without authorizing Branch Hub now.

Current research shortlist includes PowerSync, Apache CouchDB replication and Couchbase Lite/Sync Gateway, with unresolved platform/license/topology tradeoffs. Documentation alone cannot select a winner.

At least two credible candidates must be executed per the adoption workflow.

---

# 5. Core architecture already established

Dependency rule:

`Rifad UI/domain → Rifad contract → replaceable adapter → external/local implementation`

Important current boundaries:

- `PosRuntimeContract`;
- `RestaurantServiceContract` with `PlaceGroup → ServicePlace → OpenLocalOrder`;
- `CatalogAdminContract` / `CatalogReadContract`;
- `LocalPersistenceContract`;
- `SYNC_CAPABILITY_BOUNDARY.md`.

Provider schemas/IDs/SDK errors/credentials stop at adapters.

Current local persistence foundation includes stable installation identity, branch/device context, versioned private snapshots, revision metadata, transactional outbox, stable event identity/deduplication, retry/failure bookkeeping and acknowledgement.

Current browser/localStorage compatibility is staging only, not final production database selection.

Keep separate:

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA`

---

# 6. POS current product state

Current POS prototype includes:

- Arabic RTL/touch product grid;
- Quick Sale/search-first mode;
- cart quantity editing/keypad;
- inline checkout rail;
- cash payment/change/`سداد`;
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

# 7. Restaurant / delivery meanings

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

Preferred future delivery cashier UX: one `طلبات أونلاين` queue with multiple direct/aggregator adapters behind it. Current delivery work remains research/design only.

---

# 8. Back Office / catalog current model

Current executable destinations:

- `قائمة الأصناف`;
- `الفئات`;
- `مجموعات الخيارات`;
- `الإضافات`.

Current catalog meanings include name, description, category, fixed price, SKU, barcode, available-for-sale, merchant visual representation, pricing policy, reusable/general add-ons and item-private add-ons.

Merchant pricing intentionally uses reusable **مجموعات الخيارات** rather than forcing technical Cartesian variants.

Example:

`أحجام البيتزا → صغير 10 | وسط 20 | كبير 25`

An item can use:

1. fixed price;
2. shared group with inherited prices;
3. shared group with sparse item-specific overrides;
4. item-private direct options.

Sparse override means unchanged values continue inheriting the shared group.

Current browser catalog staging schema is v4 and carries:

- item appearance mode `color | image`;
- item color/shape/image staging semantics;
- category color;
- option-group color;
- reusable add-on-group color.

`imageDataUrl` is staging transport only. Production media storage/sync remains unselected.

Current cashier POS still does not render the appearance contract yet.

---

# 9. Visual lock rules for future features

Primary owner-supplied Loyverse screenshots remain the direct structural/interaction reference for this Back Office family.

Do not reintroduce:

- giant headings or decorative empty margins;
- nested card-inside-card layouts;
- gradients/heavy shadows;
- oversized preview surfaces;
- repeated Save/Cancel zones;
- visual CSS that changes shell geometry;
- complexity added merely to appear modern.

Feature-specific additions such as inventory, taxes, table configuration, permissions or delivery settings must inherit the locked shell rather than trigger a general redesign.

---

# 10. Known product/infrastructure gaps after the visual lock

- synchronization candidate runtime proof/adoption;
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
- final database schema.

The Back Office visual **reference/shell is locked**; this is not a claim that every future feature-specific screen is permanently pixel-frozen.

---

# 12. Communication / implementation preference

- Keep product discussion concise and focused until direction is clear.
- When implementation is explicitly requested, edit the branch directly rather than dumping code into chat.
- Do not invent a technology/version ladder when a mature reusable capability may already exist; research first.
- Do not merge PR #2 without explicit approval.
- Do not let external providers own Rifad's domain.