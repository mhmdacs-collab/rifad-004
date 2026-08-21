# Rifad Build Method — Capability Gates

Status: **OWNER-APPROVED BUILD METHOD**

Date: 2026-08-21

## 1. Purpose

Rifad uses UI-first discovery, replaceable contracts/adapters and proven donor evidence. Those principles are already binding, but they need one promotion path that prevents a successful mock or staging adapter from being mistaken for a production engine.

This document defines that promotion path.

The responsibilities are intentionally separate:

- `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md` answers **what Rifad builds and in what dependency order**.
- this document answers **how each capability is allowed to mature from discovery to production**.
- `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md` defines the detailed donor investigation and adoption process used when a capability reaches the Frontier/Donor Gate.

No gate in this document changes the dependency order of the final implementation map.

## 2. Capability maturity is multi-dimensional

Do not describe a substantial capability with one percentage or one ambiguous word such as “done”. A capability can have a mature UX while its persistence or production evidence remains weak.

Track these dimensions independently:

1. **Product / UX** — flows, states, actions and user-visible behavior are understood.
2. **Rifad Contract** — Rifad-owned commands, queries, DTOs, identities, errors, state transitions and ownership are defined at the appropriate maturity.
3. **Frontier / Donor Evidence** — mature external implementations/standards and the current Rifad implementation have been characterized and compared where required.
4. **Implementation** — a mock, staging implementation, Rifad core or replaceable adapter exists.
5. **Durability / Offline** — applicable restart, replay, idempotency, crash and offline behavior is proven.
6. **Conformance / Failure Evidence** — important invariants and failure paths are tested independently of one implementation.
7. **Production Evidence** — applicable migration, hardware, security, performance, operational or regulated evidence exists.

Allowed maturity labels for each dimension:

- `NONE`
- `DISCOVERY`
- `PROVEN-STAGING`
- `PRODUCTION-PROVEN`

`PRODUCTION-PROVEN` is evidence-based. Existing code, a polished UI or a green local test suite does not grant that status automatically.

## 3. The mandatory gates

### G0 — Authority and Scope

Before implementation work, define the bounded capability and its authority.

Required output:

- user/business outcome;
- owner of truth: POS, Back Office or another capability;
- dependency-map position;
- allowed scope;
- explicit non-goals;
- known upstream/downstream capability dependencies;
- risk lane: low, medium, high or regulated.

A family name such as “Tables”, “Payments” or “Shifts” is not sufficient scope by itself.

### G1 — Product Discovery

Establish the intended Rifad behavior before freezing durable implementation assumptions.

Use the approved functional baseline, mature product behavior, Saudi requirements and Rifad-specific product decisions to discover:

- flows and states;
- commands/actions;
- visible errors and recovery;
- permissions/authorization expectations;
- offline expectations;
- acceptance scenarios;
- durable meanings exposed by the product.

UI-first work and mock adapters are allowed here when they help discover the product correctly.

The result of G1 is product behavior evidence, not a production database schema.

### G2 — Rifad Contract Draft

Draft the Rifad-owned boundary needed to express the discovered behavior.

As applicable, define:

- commands and queries;
- input/output DTOs;
- stable IDs;
- errors;
- state transitions;
- explicit data ownership;
- idempotency semantics;
- offline/retry semantics;
- event/read-model boundaries;
- version/migration expectations.

The G2 contract is a **draft seam**. It is not protected from learning discovered in G4.

### G3 — Mock Ceiling

Before extending an existing mock or staging implementation, decide whether the work is still product discovery or has crossed into a real engine.

A mock may continue when the purpose is bounded UI/interaction discovery and the implementation remains cheap to replace.

The Mock Ceiling is crossed when the next work materially requires one or more of:

- a substantial domain state machine;
- a financial/cash/payment ledger;
- a durable order/payment/workforce lifecycle;
- concurrency, locking or conflict behavior;
- offline command replay/retry/deduplication beyond simple characterization;
- hardware or protocol integration;
- production persistence or schema migration logic;
- security-critical credential/authorization behavior;
- fiscal/regulatory state or evidence;
- failure/recovery semantics that would become product authority.

When the ceiling is crossed, **STOP extending the mock as the production path**. Proceed to G4 before implementing the real engine.

A bug fix that restores already-approved mock behavior does not by itself trigger a new engine. Expanding the mock into a broader capability does.

### G4 — Frontier / Donor Gate

Start from the best proven state reached elsewhere rather than inventing a substantial engine from zero.

Research is performed **per bounded slice**, not only per whole application.

For a substantial capability:

- compare at least two credible implementations; use more when the ecosystem is rich;
- include the current Rifad implementation as a candidate when relevant;
- inspect real source, not only README claims;
- inspect tests and failure cases;
- inspect issues/maintenance history where relevant;
- characterize state transitions and invariants;
- inspect persistence/restart/retry behavior when relevant;
- verify repository/file/dependency licenses and distribution obligations;
- inspect security, hardware or regulated evidence appropriate to the risk;
- pin the exact version/commit used as evidence.

Different slices may have different best sources. Do not make the first donor the hidden integration base.

G4 uses the detailed workflow in `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`.

### G5 — Adoption Decision

For each useful implementation slice, record exactly one disposition:

- `DIRECT-REUSE` — small, isolated, legally compatible code/dependency can be used behind a Rifad adapter;
- `PORT-REIMPLEMENT` — proven invariants/algorithms/state machine/test vectors are reimplemented in Rifad's stack;
- `BEHAVIORAL-REFERENCE` — behavior is useful but direct code reuse is unsuitable;
- `KEEP-RIFAD` — current Rifad implementation is supported by the evidence and remains the selected implementation;
- `REJECT` — candidate is too coupled, unsafe, weak, unmaintained, legally unsuitable or otherwise inferior.

Past implementation effort is not a selection criterion. There is no sunk-cost promotion rule.

Do not adopt an entire donor application merely to obtain one useful capability.

### G6 — Contract Freeze Candidate + Implementation

Revisit the G2 contract after product evidence and G4 characterization.

Donor/frontier knowledge may reveal missing concepts such as revisions, reservation identities, explicit states, failure results, optimistic concurrency or idempotency keys. Add the Rifad meaning if the product needs it, but do not copy donor schemas into the public contract automatically.

Correct sequence:

```text
Rifad product behavior
        ↓
Contract Draft
        ↓
Frontier / Donor characterization
        ↓
Refined Rifad Contract
        ↓
Freeze Candidate
        ↓
Rifad Core / Adapter implementations
```

The anti-pattern is:

```text
Early mock interface
        ↓
Treat accidental early shape as permanent
        ↓
Force every future implementation to preserve it
```

Only after this review should the contract become a freeze candidate for the current product scope.

Implementation remains behind Rifad-owned boundaries:

```text
Rifad UI / consumer
        ↓
Rifad Contract
        ↓
Rifad Core / Adapter
        ↓
selected implementation / protocol / provider
```

Donor types, schemas, IDs, SDK errors and lifecycle details stop below the contract.

### G7 — Conformance Gate

Turn important product and failure invariants into Rifad-owned conformance evidence.

The same meaningful test vectors should be reusable against:

- the discovery/mock implementation where useful;
- the selected real implementation;
- a future replacement implementation.

Conformance tests describe Rifad behavior, not implementation internals.

Example restaurant/order invariants discovered during staging may include:

- same product before Send aggregates in the pending batch;
- Send creates immutable dispatched history;
- the same product added after Send becomes new pending quantity;
- clearing pending changes does not alter sent history;
- restart/reopen preserves the order;
- retry of the same durable command does not duplicate kitchen dispatch.

The exact suite is capability-specific and may evolve before production contract freeze.

### G8 — Production Evidence

A capability reaches `PRODUCTION-PROVEN` only after evidence appropriate to its risk lane exists.

Examples:

#### Low risk

- unit/conformance evidence;
- license/provenance where reused code is involved.

#### Medium risk

Examples: printing, device discovery, local persistence.

Additional evidence may include:

- restart/reconnect behavior;
- hardware/device matrix;
- corruption/interruption behavior;
- migration evidence;
- realistic capacity/performance behavior.

#### High risk

Examples: synchronization, payments, destructive migrations, tenant isolation.

Additional evidence may include:

- stable identities and idempotent replay;
- ambiguous-result recovery;
- duplicate prevention;
- conflict policy;
- security/isolation evidence;
- rollback/recovery;
- operational evidence under realistic failure.

#### Regulated

Example: ZATCA/fiscal.

Additional evidence includes applicable official specifications/vectors and certificate/state/retry/audit evidence. A third-party library passing its own tests is never sufficient by itself.

## 4. Gate evidence and current Rifad work

The gates preserve valuable existing work without declaring it production automatically.

Existing work may be used as:

- product/UX evidence;
- draft contract evidence;
- regression/conformance test vectors;
- staging durability evidence;
- a candidate implementation evaluated at G4/G5.

At G5, a strong current implementation may be selected as `KEEP-RIFAD`. A weaker current implementation may be replaced below the Rifad contract while retaining the product surface and useful tests.

This is how Rifad protects good work without becoming trapped by it.

## 5. Relationship to the Capability Adoption Workflow

G4 starts the detailed adoption workflow.

Mapping:

- Build Method G0–G2 → bounded Rifad behavior and draft boundary;
- G3 → decides whether continued mock work is allowed;
- G4 → `CAPABILITY_ADOPTION_WORKFLOW` steps 3–5: search, execute/characterize, legal fit;
- G5 → adoption workflow step 6 and donor decision record;
- G6 → adoption workflow step 7: integrate inside Rifad;
- G7 → adoption workflow step 8: prove conformance;
- G8 → adoption workflow steps 8–10 plus capability-specific production evidence and release/replaceability.

The existing adoption workflow remains binding and is not replaced by this document.

## 6. Applying the gates to implementation-map items

A map item can be decomposed internally into gate-driven slices without changing the master dependency order.

For example, MAP-02 may be executed as:

1. `MAP-02A` — Product/behavior characterization;
2. `MAP-02B` — Rifad contract drafts;
3. `MAP-02C` — Frontier/Donor research;
4. `MAP-02D` — Adoption decisions;
5. `MAP-02E` — Implementation;
6. `MAP-02F` — Conformance + offline workday proof.

Shift, Cash Drawer Ledger and Time Clock may have separate contracts and separate donor decisions even when grouped under one dependency-map item.

A map item is not authorized to skip the gates merely because it is listed as the next item.

## 7. Examples of mandatory Mock Ceiling stops

### Tables / open local orders

The current local/mock restaurant behavior may continue to serve approved regression and UX discovery. A move into production multi-device locking, durable move/merge/split lifecycle, production table persistence or broader correction/void state machine crosses G3 and requires G4.

### Shift / cash drawer

A mock shift screen can be used to discover cashier workflow. Building authoritative expected-cash calculations, drawer movements, close/reconciliation and offline restart semantics crosses G3 and requires G4.

### Payments

Mock Cash/Network UX may prove the cashier flow. Real terminal/provider state, unknown-result recovery, normalized payment records, reconciliation and refunds cross G3 and require G4.

### Printing

Receipt preview/UI may be mocked. Production ESC/POS layout/transport/device recovery crosses G3 and requires G4 plus physical evidence at G8.

### ZATCA

Any authoritative fiscal state/signing/reporting/clearance behavior is regulated work and must not grow out of a generic mock. It follows the full gate path with official evidence.

## 8. Promotion rules

A capability must not be called production-ready merely because:

- the UI works;
- the mock has many tests;
- one donor demo works;
- a donor's own test suite is green;
- the implementation survived a clean restart;
- the code already took significant effort to write.

Promotion is based on the applicable gates and evidence.

Conversely, do not rebuild a proven Rifad implementation merely to satisfy process ceremony. If G4/G5 evidence supports the current implementation and G7/G8 evidence passes, select `KEEP-RIFAD` and continue.

## 9. Scope not defined here

This document does not yet define:

- the exact session-start protocol for Codex/other coding agents;
- a single AI project entrypoint file;
- the persistent file format for the Capability Maturity Matrix;
- exact future MAP-02 product decisions;
- production technology selection for persistence, synchronization, hardware, payments or fiscal.

Those remain separate decisions and must not be invented as a side effect of adopting these gates.
