# Rifad Documentation Map

Last updated: 2026-08-18

This directory separates binding Rifad decisions from historical/research evidence.

## New-session / Codex continuation entry point

When resuming current work, read:

1. `../PROJECT_RULES.md`;
2. `architecture/CURRENT_DECISIONS.md`;
3. `CURRENT_WORK_HANDOFF_2026-08-18.md`;
4. the authority map below.

For the current Back Office/Loyverse evidence:

- `research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md`.

For the new synchronization priority and candidate evidence:

- `architecture/SYNC_CAPABILITY_BOUNDARY.md` — binding Rifad sync behavior/boundary;
- `research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md` — Loyverse behavioral research, candidate comparison and mandatory execution proof.

## Authority order

When documents conflict, use this order:

1. `PROJECT_RULES.md` at repository root.
2. `architecture/CURRENT_DECISIONS.md`.
3. `architecture/RIFAD_ARCHITECTURE.md` plus current capability/adoption boundary documents, including `architecture/SYNC_CAPABILITY_BOUNDARY.md`.
4. `ui/UI_EXECUTION_MANIFEST.json` for implementation identity/readiness/scope.
5. `ui/DESIGN_AUTHORITY.md` for POS interaction/visual authority.
6. `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` for canonical labels and UI-to-data field traceability.
7. `ui/UI_PROGRESS.md` and current UI/product plans.
8. `CURRENT_WORK_HANDOFF_2026-08-18.md` for the latest continuation checkpoint when it does not conflict with higher authority.
9. Research/historical proposals as evidence only.

A product/visual discussion can be documented before implementation while remaining explicitly not manifest-authorized. Restaurant local service has a bounded executable prototype under `POS-FLOW-002`; the first bounded Back Office catalog slice is `BO-FLOW-002`; online-order/delivery connector implementation remains pending separate scope.

## Current sequencing clarification

D-030 still prohibits freezing the final production business/database model before durable product-field discovery is sufficiently mature.

D-032 now clarifies that this **does not postpone synchronization until the Back Office and POS feature sets are complete**.

Current intended sequence:

1. lock the current Loyverse-reference visual shell enough to stop visual churn;
2. execute/prove synchronization candidates according to the adoption workflow;
3. adopt one replaceable schema-tolerant synchronization capability;
4. connect Back Office ↔ POS through that real path;
5. continue new product features/field discovery end-to-end through synchronization;
6. freeze the mature production domain/data model later.

No synchronization technology has been selected yet. Research claims are not adoption evidence.

## Current implementation documents

- `CURRENT_WORK_HANDOFF_2026-08-18.md` — cross-domain continuation checkpoint.
- `architecture/CURRENT_DECISIONS.md` — binding current decisions, including D-030/D-032 sequencing.
- `architecture/RIFAD_ARCHITECTURE.md` — overall capability/module direction.
- `architecture/POS_RUNTIME_ADAPTER_BOUNDARY.md` — general POS runtime composition/injection boundary.
- `architecture/RESTAURANT_SERVICE_ADAPTER_BOUNDARY.md` — restaurant/place adapter boundary.
- `architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md` — local-first persistence identity, snapshots, transactional outbox and retry/ack semantics.
- `architecture/SYNC_CAPABILITY_BOUNDARY.md` — **current synchronization behavior, replaceability, schema-evolution, permissions and proof boundary.**
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
- `research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md` — **current synchronization benchmark:** observable Loyverse behavior, candidate landscape, platform/license risks and execution proof matrix.
- `research/loyverse/` — broader Loyverse product/UI/technical evidence.
- `research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md` — restaurant/service/channel benchmark.
- `research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md` — delivery-platform API evidence and adapter direction.
- `research/historical-proposals/` — earlier architecture proposals retained as evidence only.

Research remains evidence, not automatic implementation authority. A public library or vendor feature is not adopted until the capability workflow executes it, inspects failure behavior/licensing and proves Rifad conformance.
