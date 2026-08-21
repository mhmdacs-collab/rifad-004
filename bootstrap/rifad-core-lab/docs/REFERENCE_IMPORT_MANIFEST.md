# Rifad Core Lab — Reference Import Manifest

Status: **BOOTSTRAP IMPORT PLAN**

Historical source repository: `mhmdacs-collab/rifad-004`

Source branch for the approved architecture bootstrap: `agent/rifad-capability-gates-foundation`

The Core Lab must be self-contained enough that a new session can work without depending on chat history. Historical material is imported selectively and classified so old staging architecture does not silently become new authority.

## A. MUST IMPORT — product baseline evidence

Copy these into `docs/research/loyverse/` as research evidence:

1. `docs/research/loyverse/Loyverse_Phase_1_UI_UX_Functional_Analysis_AR.md`
   - source blob: `f2e8cc3e0d4a8113fe2f764e902b5714cae0c127`
   - role: primary historical functional/UI workflow inventory.

2. `docs/research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md`
   - source blob: `3f049464004503e4fa766a8c580bec88f362887d`
   - role: current Back Office reference evidence.

3. `docs/research/loyverse/loyverse_phase_2_technical_architecture_ar.md`
   - source blob: `79bdda43866f0a913b69ac8246ff381f3e8c3136`
   - role: historical technical research/hypotheses only; **not authority about proprietary Loyverse internals** unless independently supported.

4. `docs/research/loyverse/loyverse_phase_3_database_api_integrations_ar.md`
   - source blob: `7ed9aca77f7b679145c706565f7931dc830587c0`
   - role: historical database/API/integration research/hypotheses only; **not Core-selection authority by itself**.

## B. MUST IMPORT — sourcing/build authority

These are copied into the clean lab as binding authority:

- `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`
- `docs/architecture/RIFAD_BUILD_METHOD.md`
- `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`
- `docs/donors/DONOR_POLICY.md`
- `docs/donors/DONOR_INVENTORY_TEMPLATE.md`

The clean lab's own `AI_PROJECT_ENTRYPOINT.md`, `PROJECT_RULES.md`, product target, parity target and Core-selection method override historical implementation assumptions.

## C. IMPORT AS HIGH-VALUE TECHNICAL EVIDENCE

### Sync

Copy into `docs/research/sync/`:

- `docs/research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md`
- `docs/research/sync/SYNC_CANDIDATE_SCORECARD_2026-08-18.md`
- `docs/research/sync/SYNC_CANDIDATE_EXECUTION_2026-08-18.md`

Role: evidence for how candidate technology was previously benchmarked, executed, broken/retried and scored. No sync provider is automatically selected for the new Core.

### Restaurant/product benchmarking

Copy into `docs/research/restaurant-pos/`:

- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`
- `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`

Role: product/market behavior evidence, not automatic implementation architecture.

## D. CONSOLIDATE — do not blindly copy as authority

The following historical areas contain useful product behavior but are mixed with old implementation state. Extract approved product decisions/test vectors into clean product evidence rather than making the files Core Lab authority:

- `docs/ui/UI_EXECUTION_MANIFEST.json`
- `docs/ui/UI_PROGRESS.md`
- `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`
- `docs/CURRENT_WORK_HANDOFF_2026-08-21.md`
- payment/delivery architecture decisions;
- current Front Office restaurant/table regression evidence.

Important behavior to preserve includes:

- inline Add Customer workflow;
- customer credit/debt collection semantics;
- delivery channel vs merchant collection separation;
- SENT/PENDING restaurant behavior;
- sent kitchen history immutability in current cashier flow;
- same-product-after-Send creates new pending quantity;
- clearing pending does not erase sent history;
- stable restart/idempotency scenarios;
- owner/cashier permission decisions already accepted.

These are **product/test-vector evidence**, not proof the old mock/domain architecture should be retained.

## E. DO NOT IMPORT AS NEW AUTHORITY

Do not make these binding in the Core Lab:

- old `RIFAD_FINAL_IMPLEMENTATION_MAP.md` as the new build plan;
- historical MAP branch sequencing;
- current mock/staging database choices;
- old requirement that every capability live behind a Rifad-owned adapter;
- current React/mock domain shapes as required Core interfaces;
- historical proposals that conflict with Primary Core + Capability Grafting.

They may be consulted as historical evidence when useful.

## F. Production code import rule

Do not copy current `rifad-004` runtime code into the Core Lab wholesale.

Code may be brought forward only when:

- it is needed to characterize a candidate;
- it provides a useful test vector/product behavior reference;
- or it wins an evidence-based `KEEP-RIFAD` comparison.

The Core Lab is for selection/simulation, not for preserving existing implementation by inertia.

## G. Refresh rule

Loyverse/current-market behavior that may have changed should be refreshed against reliable current public evidence before a final parity or Core decision depends on it.
