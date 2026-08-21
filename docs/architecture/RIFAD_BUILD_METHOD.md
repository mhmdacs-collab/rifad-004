# Rifad Build Method — Capability Gates

Status: **OWNER-APPROVED BUILD METHOD**

Date: 2026-08-21

## 1. Purpose

Rifad uses product-first discovery, evidence-driven implementation sourcing and production proof.

The method must prevent two opposite failures:

1. growing a convenient mock into a production engine merely because code already exists;
2. rebuilding mature solved systems from zero merely to claim that Rifad wrote the core.

Rifad product ownership does not require green-field implementation authorship.

Read this with:

- `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md` — how whole-core selection and capability grafting work;
- `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md` — detailed execution/inspection/adoption procedure;
- `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md` — what/when Rifad builds.

The Final Implementation Map answers **what and in what dependency order**. This document answers **how a capability or core is allowed to mature**.

## 2. Capability maturity is multi-dimensional

Do not describe a substantial capability with one percentage or one ambiguous word such as “done”.

Track independently:

1. **Product / UX** — flows, states, actions and customer behavior are understood.
2. **Boundary / Contract** — the execution seam, durable meanings, identities and ownership are understood at the appropriate maturity. This may be a Rifad contract, thin facade, native core extension seam or other deliberate boundary.
3. **Frontier / Source Evidence** — mature whole-core and/or capability implementations have been characterized and compared where required.
4. **Implementation** — mock, staging implementation, selected Primary Core, graft or Rifad implementation exists.
5. **Durability / Offline** — applicable restart, replay, idempotency, crash and offline behavior is proven.
6. **Conformance / Failure Evidence** — important invariants and failure paths are tested independently of happy-path UI success.
7. **Production Evidence** — applicable migration, hardware, security, performance, operational or regulated evidence exists.

Allowed labels for each dimension:

- `NONE`
- `DISCOVERY`
- `PROVEN-STAGING`
- `PRODUCTION-PROVEN`

`PRODUCTION-PROVEN` is evidence-based. Existing code, a polished UI, a broad feature list or a green local test suite does not grant that status automatically.

# 3. Mandatory gates

## G0 — Authority and Scope

Before implementation work, define the bounded product outcome and its dependency position.

Required output:

- user/business outcome;
- owner-facing and cashier-facing behavior as applicable;
- dependency-map position;
- allowed scope;
- explicit non-goals;
- known upstream/downstream dependencies;
- risk lane: low, medium, high or regulated.

A family name such as “Tables”, “Payments” or “Shifts” is not enough.

For foundation-level work, also state whether the decision could affect the **Primary Core** choice.

## G1 — Product Discovery

Establish intended Rifad behavior before freezing implementation assumptions.

Use mature product behavior, Saudi requirements and Rifad-specific decisions to discover:

- flows/states;
- commands/actions;
- errors and recovery;
- permissions/authorization expectations;
- offline expectations;
- acceptance scenarios;
- durable business meanings exposed by the product.

UI-first work and mocks are allowed when they help the product owner discover the right experience.

The result of G1 is behavior evidence, not a final engine or database schema.

## G2 — Boundary Draft

Draft the minimum execution/data boundary needed to express the discovered behavior.

As applicable define:

- commands/queries;
- stable IDs;
- errors/results;
- state transitions;
- durable ownership;
- idempotency/retry semantics;
- event/read-model boundaries;
- version/migration expectations.

The G2 boundary is a **draft seam**. It may change after mature implementation characterization.

Do not force a heavy Rifad contract or adapter when a selected Primary Core can safely expose the needed behavior through a simpler controlled seam.

## G3 — Mock Ceiling

Before extending a mock/staging implementation, decide whether the work is still discovery or has crossed into a real engine.

A mock may continue while the purpose is bounded UI/interaction discovery and it remains cheap to replace.

The ceiling is crossed when the next work materially requires one or more of:

- substantial domain state machine;
- financial/cash/payment ledger;
- durable order/payment/workforce lifecycle;
- concurrency, locking or conflict behavior;
- production offline/replay/retry/deduplication;
- hardware/protocol integration;
- production persistence/schema migration;
- security-critical behavior;
- fiscal/regulatory state/evidence;
- failure/recovery semantics that would become production authority.

When crossed: **STOP extending the mock as the production path. Proceed to G4.**

A narrow bug fix that restores already-approved staging behavior does not automatically trigger a new engine review.

## G4 — Frontier, Core and Source Simulation Gate

This is the most important sourcing gate.

Do not assume in advance that Rifad should build a new engine, keep the current engine, or use only small donor slices.

### G4A — Whole-core scan

When no Primary Core has been explicitly selected, or when the decision materially affects the system foundation, evaluate serious whole-core candidates first.

Ask:

> Is there a mature engine we can legally control that already carries a large share of Rifad more safely than our current/green-field path?

Evaluate candidates such as mature POS/ERP/accounting engines and the current Rifad implementation.

Inspect/simulate as applicable:

- money/rounding correctness;
- transaction integrity;
- sales/orders;
- catalog/pricing/options;
- inventory;
- shifts/cash/time clock;
- customers/credit/loyalty;
- payments/refunds;
- taxes;
- restaurant/tables;
- persistence/restart/crash;
- concurrency/multi-device;
- LAN;
- API/extensibility;
- database/migrations;
- offline;
- sync attachment;
- printing/hardware seams;
- security/permissions;
- multi-branch/tenant implications;
- accounting where useful;
- ZATCA attachment feasibility;
- performance/volume;
- maintenance/dependencies;
- licensing/redistribution/modification rights.

For every serious core candidate perform an **architecture simulation** before adoption: what we retain, what we modify, what needs grafting, how LAN/tables/offline/API/sync/ZATCA would attach, and what long-term maintenance burden is created.

### G4B — Capability source scan

Once a Primary Core is selected, or when the decision is clearly a bounded gap, search mature implementations per capability slice.

Examples:

- LAN discovery/pairing/reconnect;
- table/open-order lifecycle;
- KDS dispatch;
- printing;
- sync;
- payment provider state;
- local persistence;
- fiscal behavior.

For substantial work:

- compare multiple credible implementations;
- include the selected core's native implementation and current Rifad code where relevant;
- inspect real source, tests and failure cases;
- inspect issues/maintenance/dependencies;
- characterize state transitions and invariants;
- inspect persistence/restart/retry behavior;
- verify licenses;
- pin exact versions/commits.

Language mismatch is not a blocker. A Java/Python/C++/PHP implementation can still provide the best algorithm, state machine, protocol or test vectors to port into the chosen runtime.

G4 uses `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`.

## G5 — Selection Decision

Selection happens at the correct level.

### Whole-core dispositions

- `ADOPT-PRIMARY-CORE`
- `KEEP-CURRENT-CORE`
- `CONTINUE-RESEARCH`
- `REJECT`

### Capability dispositions

- `DIRECT-REUSE`
- `PORT-REIMPLEMENT`
- `BEHAVIORAL-REFERENCE`
- `KEEP-CORE`
- `KEEP-RIFAD`
- `EXTERNAL-SERVICE`
- `REJECT`

Past implementation effort is not a selection criterion.

External maturity is also not automatic authority: a candidate must fit Rifad.

The decision must record why the selected path is better on stability, correctness, capabilities, future fit, operational risk, licensing and maintenance.

## G6 — Integration and Boundary Freeze Candidate

After G4/G5, refine the G2 boundary around the selected implementation.

Correct sequence:

```text
Rifad product behavior
        ↓
Boundary Draft
        ↓
Core / source characterization + simulation
        ↓
Selection
        ↓
Refined boundary
        ↓
Implementation / graft / direct core modification
```

Integration style is not predetermined.

Valid approaches include:

- direct modification of the selected Primary Core;
- native core extension/plugin mechanism;
- thin facade;
- adapter;
- internal module;
- external sidecar/service.

Use the **simplest maintainable approach** that protects the product and important external seams.

Adapters are a tool, not a doctrine. Do not add one when Rifad directly controls the core and the extra layer provides no meaningful isolation, translation or replacement benefit.

Do not copy an external schema/API into customer-facing product behavior blindly.

## G7 — Conformance and Failure Gate

Turn important Rifad behavior into tests/evidence.

Tests must prove the behavior Rifad depends on, not implementation trivia.

For replaceable/grafted capabilities, use implementation-independent conformance cases where practical.

Examples for restaurant/order behavior may include:

- same product before Send aggregates in pending;
- Send creates immutable history;
- same product after Send becomes new pending quantity;
- clearing pending does not alter sent history;
- restart/reopen preserves the order;
- retry does not duplicate kitchen dispatch.

Examples for LAN may include pairing, reconnect, sequence/replay, duplicate suppression and device loss.

Examples for payments may include timeout, decline, unknown result, retry, duplicate prevention and reconciliation.

A donor's own green tests are useful evidence but never substitute for the Rifad cases we depend on.

## G8 — Production Evidence

A core/capability reaches `PRODUCTION-PROVEN` only after evidence appropriate to its risk exists.

### Low risk

- unit/invariant evidence;
- legal/provenance evidence where reused code is involved.

### Medium risk

Examples: printing, LAN discovery, local persistence.

Additional evidence may include:

- restart/reconnect;
- hardware/device matrix;
- interruption/corruption behavior;
- migrations;
- capacity/performance.

### High risk

Examples: sync, payments, destructive migrations, multi-device state, tenant isolation.

Additional evidence may include:

- stable identities/idempotency;
- ambiguous-result recovery;
- duplicate prevention;
- conflict policy;
- security/isolation;
- rollback/recovery;
- realistic failure operation.

### Regulated

Example: ZATCA/fiscal.

Additional evidence includes applicable official specifications/vectors plus certificate/state/retry/audit evidence.

# 4. Existing Rifad work

The gates preserve useful work without granting it production authority automatically.

Existing code may be used as:

- Product/UX evidence;
- regression and conformance vectors;
- staging durability evidence;
- a current-core candidate;
- a capability candidate.

If evidence shows current Rifad code is strongest, keep it.

If a mature Primary Core is stronger, adopt the core and preserve/reuse useful Rifad UI, product behavior and tests.

If the core is strong except for one capability, graft the stronger capability rather than replacing the whole foundation.

This is how Rifad avoids both sunk-cost lock-in and needless rebuilding.

# 5. Applying gates to MAP items

The map remains the dependency order, but a map item can be decomposed internally.

For example MAP-02 can become:

1. product/workflow discovery;
2. core-native capability characterization;
3. external Shift/Cash/TimeClock source comparison;
4. architecture simulation against the selected/current core;
5. selection decisions;
6. implementation/grafting;
7. conformance + offline workday proof.

If the Primary Core itself has not yet been deliberately selected, a foundation/core review may precede MAP-02 implementation because Shift/Cash is exactly the kind of engine capability that can reveal whether the chosen foundation is appropriate.

The map item being next never means “start writing the engine immediately.”

# 6. Mandatory stop examples

### Tables / open orders

The current mock may serve UX/regression discovery. Production multi-device locking, durable move/merge/split, correction/void lifecycle or real table persistence crosses G3. At G4, first ask whether the selected/possible Primary Core already has a superior table/order engine; then inspect other table implementations for gaps.

### Shift / cash drawer

A mock screen is allowed for UX discovery. Authoritative expected-cash calculation, drawer ledger and close/reconciliation cross G3. Compare mature core/native and external implementations before writing the engine.

### LAN

Do not invent discovery/pairing/reconnect/replay from zero if a mature POS already solved it. Characterize the strongest implementation and port/reuse/reimplement what fits the Primary Core.

### Payments

Mock Cash/Network UX may remain product evidence. Real terminal/provider state, unknown results, normalized records, reconciliation and refunds require G4/G7/G8.

### Printing

Receipt preview may be mocked. Production ESC/POS layout/transport/recovery should start from proven implementations and physical evidence.

### ZATCA

Any authoritative fiscal state/signing/reporting/clearance follows the full regulated path and official evidence.

# 7. Promotion rules

A core/capability is not production-ready merely because:

- the UI works;
- the mock has many tests;
- the donor demo works;
- a broad ERP has many modules;
- the implementation survived a clean restart;
- significant time has already been invested.

Likewise, do not rebuild proven functionality just to satisfy process ceremony.

The governing question is:

> **Is this the strongest practical implementation we can legally control, test, maintain and evolve for Rifad?**

# 8. Scope not defined here

This document does not yet define:

- the exact Codex session-start protocol;
- the single AI project entrypoint;
- the persistent format of the Capability Maturity Matrix;
- which Primary Core candidate wins;
- exact future MAP-02 product decisions.

Those require separate evidence/decisions and must not be invented as a side effect of this update.
