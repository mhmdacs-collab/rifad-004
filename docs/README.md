# Rifad Documentation Map

Last updated: 2026-08-21

This directory separates binding Rifad decisions from current execution records and historical/research evidence.

## New-session / continuation entry point

When resuming current work, read in this order:

1. `../PROJECT_RULES.md`;
2. `architecture/CURRENT_DECISIONS.md`;
3. `RIFAD_FINAL_IMPLEMENTATION_MAP.md`;
4. `MAP_00_REALITY_AUTHORITY_RECONCILIATION.md` while MAP-00 is active/recent;
5. `CURRENT_WORK_HANDOFF_2026-08-21.md` for the bounded Front Office regression lane;
6. `CURRENT_WORK_HANDOFF_2026-08-18.md` for the wider cross-domain checkpoint;
7. the authority map below.

For the current Back Office/Loyverse evidence:

- `research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md`.

For preserved synchronization research/evidence:

- `architecture/SYNC_CAPABILITY_BOUNDARY.md` — binding Rifad sync behavior/boundary;
- `research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md` and the current execution evidence under `research/sync/`.

Synchronization research is **preserved but not the current implementation gate**. D-033 and `RIFAD_FINAL_IMPLEMENTATION_MAP.md` control re-entry timing.

## Authority order

When documents conflict, use this order:

1. `PROJECT_RULES.md` at repository root.
2. `architecture/CURRENT_DECISIONS.md`.
3. `architecture/RIFAD_ARCHITECTURE.md` plus current capability/adoption boundary documents.
4. `RIFAD_FINAL_IMPLEMENTATION_MAP.md` for the owner-approved dependency order when it does not conflict with 1–3.
5. `ui/UI_EXECUTION_MANIFEST.json` for implementation identity/readiness/scope.
6. `ui/DESIGN_AUTHORITY.md` for POS interaction/visual authority.
7. `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` for canonical labels and UI-to-data field traceability.
8. `ui/UI_PROGRESS.md` and current UI/product plans.
9. `CURRENT_WORK_HANDOFF_2026-08-21.md`, then `CURRENT_WORK_HANDOFF_2026-08-18.md`, for continuation checkpoints when they do not conflict with higher authority.
10. Research/historical proposals as evidence only.

A product/visual discussion can be documented before implementation while remaining explicitly not manifest-authorized. Restaurant local service has a bounded executable prototype under `POS-FLOW-002`; the bounded Back Office catalog family is `BO-FLOW-002`; online-order/delivery connector implementation remains pending separate scope.

## Current sequencing — D-033 / Final Implementation Map

D-030 still prohibits freezing the final production business/database model before durable product-field discovery is sufficiently mature.

D-033 supersedes the old D-032 **immediate sequencing** while preserving D-032's synchronization behavior/adoption requirements.

The current dependency order is:

1. **MAP-00 — reality/authority reconciliation:** make manifest/progress/field register/continuation documents match the code that actually exists;
2. **MAP-01 — effective POS configuration + authorization:** locally enforce owner-managed feature/payment/tax/permission policy and one-action manager override semantics;
3. **MAP-02 — shift/cash/time clock:** establish cashier workday and cash-accountability facts;
4. **MAP-03 — complete sale-line truth:** pricing options, add-ons, discounts, taxes, fulfillment and sold snapshots;
5. **MAP-04 / MAP-05 — open-order + payment/receipt/refund lifecycle:** complete the remaining core cashier transaction lifecycle;
6. **MAP-06 — production local persistence:** replace browser staging behind `LocalPersistenceContract` and prove migrations/recovery/volume;
7. **MAP-07 / MAP-08 / MAP-09 — real hosts/devices:** packaged Windows offline/cold-start/crash behavior, physical scanner/printer/cash drawer, and supported tablet/PWA local-first behavior;
8. **MAP-10 — synchronization re-entry/final adoption:** re-evaluate retained candidate evidence using real Rifad operational facts and final licensing/operational gates;
9. **MAP-11 — real Back Office ↔ POS integration:** owner configuration down, authorized operational facts up through Rifad-owned cloud/sync boundaries;
10. **MAP-12 — post-core verticals:** inventory, restaurant administration/KDS/CDS, delivery, fiscal, accounting and other lanes on the real foundation.

This does **not** postpone synchronization until every Rifad feature is complete. The re-entry threshold is the operational cashier core plus production local truth, not the entire future product.

No synchronization technology is production-selected. Existing PowerSync/CouchDB proofs remain research/adoption evidence and must not be discarded or promoted through sunk-cost momentum.

## Current product reality

### POS

Current executable POS already includes device linking, employee PIN, touch/Quick Sale, sale-page editing, basket/quantity flows, cash checkout, mock card UX, customer/credit/loyalty behavior, receipts/reprint/email behavior, restaurant local-service/open-place behavior, local-persistence journaling and staging cold-restart reconstruction.

Important current gaps include shifts/cash, time clock, effective permissions/configuration, POS option/add-on selection and sold snapshots, complete open-ticket lifecycle, normalized payment records/split payment, receipt detail/refunds, production local database, packaged host proof and real hardware/integration transports.

### Back Office

Back Office is not empty. Its visual shell is locked and `BO-FLOW-002` implements the catalog family: item list/editor, categories, reusable pricing option groups, reusable/private add-ons, SKU/barcode staging identity, availability and merchant-controlled catalog visual identity.

Current `BrowserCatalogAdapter` is **schema v4 staging evidence only**. Browser local storage and `imageDataUrl` are not production Back Office/database/media topology.

### Local-first foundation

`LocalPersistenceContract` already owns stable installation/branch/device identity, private versioned snapshots, revision metadata, transactional outbox identity, retry bookkeeping and acknowledgement. Current browser transport proves clean reconstruction of current operational state but not production crash/disk/Windows-volume guarantees.

Keep separate:

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA`

## Current implementation documents

- `RIFAD_FINAL_IMPLEMENTATION_MAP.md` — owner-approved dependency-ordered execution roadmap.
- `MAP_00_REALITY_AUTHORITY_RECONCILIATION.md` — code/product/docs reality audit and MAP-00 evidence.
- `CURRENT_WORK_HANDOFF_2026-08-21.md` — bounded Front Office regression-finalization handoff; explicitly does not promote MAP-04/MAP-05.
- `CURRENT_WORK_HANDOFF_2026-08-18.md` — cross-domain continuation checkpoint; updated by MAP-00 when current sequencing changes.
- `architecture/CURRENT_DECISIONS.md` — binding current decisions, including D-030/D-032/D-033.
- `architecture/RIFAD_ARCHITECTURE.md` — overall capability/module direction.
- `architecture/POS_RUNTIME_ADAPTER_BOUNDARY.md` — general POS runtime composition/injection boundary.
- `architecture/RESTAURANT_SERVICE_ADAPTER_BOUNDARY.md` — restaurant/place adapter boundary.
- `architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md` — local-first persistence identity, snapshots, transactional outbox and retry/ack semantics.
- `architecture/SYNC_CAPABILITY_BOUNDARY.md` — synchronization behavior/replaceability/security proof boundary; adoption currently paused until MAP-10.
- `architecture/BACK_OFFICE_CATALOG_BOUNDARY.md` — Back Office/POS catalog meaning and field-discovery boundary.
- `adoption/CAPABILITY_ADOPTION_WORKFLOW.md` — mandatory workflow for evaluating/reusing proven external capabilities.
- `donors/` — donor policy/evidence record templates.
- `ui/UI_EXECUTION_MANIFEST.json` — binding screen/action/state/flow inventory.
- `ui/UI_EXECUTION_MANIFEST_SCHEMA.md` — manifest implementation gate/evidence.
- `ui/DESIGN_AUTHORITY.md` — functional/visual authority and touch-first rules.
- `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` — canonical terminology and durable-field traceability.
- `ui/UI_PROGRESS.md` — living implemented/reviewed/pending product state.
- `ui/flows/` — bounded vertical implementation slices.
- `ui/visual-decisions/` — approved/current visual interaction decisions.

## Data-model guardrail

Do not postpone UI/product field discovery until database design.

If product/UI introduces a new field, option, fulfillment mode, payment/collection fact, sales channel, integration mapping, customer attribute, setting or status, update `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` and classify it appropriately.

A visible control does not automatically mean one database column. Derived presentation state stays derived where appropriate; facts that must survive restart/reporting/synchronization/integration receive explicit Rifad-owned meaning.

Invisible infrastructure facts such as installation identity, branch/device routing context, local snapshot versions, sync checkpoints/cursors, outbox event identity and retry metadata belong to architecture/persistence/sync boundaries rather than cashier UI merely because they are durable.

## Research

- `research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md` — current Back Office reference snapshot and Rifad-vs-Loyverse boundaries.
- `research/loyverse/` — broader Loyverse product/UI/technical evidence.
- `research/sync/` — preserved synchronization benchmark/execution evidence; no production provider selected.
- `research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md` — restaurant/service/channel benchmark.
- `research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md` — delivery-platform API evidence and adapter direction.
- `research/historical-proposals/` — earlier architecture proposals retained as evidence only.

Research remains evidence, not automatic implementation authority. A public library or vendor feature is not adopted until the capability workflow executes it, inspects failure behavior/licensing and proves Rifad conformance.
