# Rifad — AI Project Entrypoint

Status: **CANONICAL SESSION ENTRYPOINT**

Last updated: 2026-08-21

> **Mandatory rule:** Any new ChatGPT/Codex/AI session or new human technical lead must read this file **before** proposing architecture, implementation, refactors, donor selection, MAP work, or repository changes.
>
> Do not ask the product owner to retell project history that can be recovered from this file and the authority documents it links.

---

## 1. What this file is

This is the single continuity entrypoint for Rifad.

It exists because AI/chat sessions may end without warning. The repository, not chat memory, must preserve enough state that a fresh session can recover:

- what Rifad is;
- what the product owner is responsible for;
- what the technical/AI role is responsible for;
- the approved product target;
- the approved sourcing/build philosophy;
- what current code means and does **not** mean;
- current repository/PR state;
- the current strategic task;
- which documents contain the detailed evidence.

This file is intentionally an executive map, not a duplicate of every specification. Follow its links for detail.

---

## 2. Product ownership — non-negotiable intent

### Product owner role

The product owner defines:

- what customers need;
- which features Rifad should have;
- cashier/owner workflows and product behavior;
- the Rifad UI/UX direction;
- Saudi-market priorities and commercial requirements.

The product owner does **not** care what engine, programming language, framework, database or open-source lineage is used behind the product merely for architectural purity.

The engineering objective is the strongest practical Rifad product: stable, fast, mathematically correct, capable, maintainable, extensible and affordable.

### Product north star — Loyverse parity first

The approved first product horizon is **100% functional/workflow parity with the adopted observable Loyverse baseline before Rifad treats the baseline as complete and moves on to systematic differentiation beyond it**.

This means:

- do not deliberately stop at an arbitrary 70% or 80% feature subset and call the baseline complete;
- use Loyverse as a known product horizon so architecture and Core selection are evaluated against the future product we already know we need, not only the next screen;
- cover the adopted observable behavior across POS, Back Office, Dashboard, KDS and Customer Display, including relevant flows, states, permissions, errors and offline/recovery behavior;
- Restaurant/service behavior is part of that target where present in the adopted baseline;
- Rifad may add Saudi requirements, ZATCA, local market behavior and explicit owner-approved improvements without waiting for parity when they are necessary foundations;
- Rifad owns its visual identity and implementation; parity is functional/workflow parity, not source-code copying and not an assumption about proprietary Loyverse internals;
- any deliberate omission from the adopted Loyverse baseline must be an explicit product-owner decision and recorded as such.

The purpose is strategic: **design and select the engine while seeing the near future now**, so Rifad does not repeatedly rebuild foundations when later baseline capabilities arrive.

### AI / technical-lead role

The technical/AI responsibility is to:

- find the strongest existing engines and implementations before inventing substantial code;
- inspect real source, tests, failure behavior, database design, maintenance and licenses;
- execute candidates where practical instead of trusting feature lists/READMEs;
- simulate how candidates fit the full Rifad/Loyverse-parity horizon before adoption;
- choose the strongest Primary Core and best capability slices on evidence;
- identify architectural dead ends early;
- decide whether to retain, modify, reuse, port, reimplement, graft, isolate or reject technical implementations;
- preserve product behavior while minimizing unnecessary bespoke engineering.

**Do not push implementation-selection responsibility back onto the product owner.** Ask the owner when a decision changes customer/product behavior, not merely because there are several technical options.

---

## 3. Core sourcing strategy — binding

Rifad owns the **product**, not a requirement that every engine be written from zero.

A mature open-source POS, ERP, accounting engine or other system may become Rifad's **Primary Core** if evidence shows that it is the strongest practical foundation.

Examples such as Odoo, ERPNext, another POS, the existing Rifad code, or a different engine are candidates only. No candidate wins by name, previous effort or architectural fashion.

### Required sourcing order

Before building a substantial engine from zero:

1. Search for a mature **whole-core candidate** capable of carrying a large share of Rifad.
2. Run architecture simulation against the full expected Rifad/Loyverse-parity horizon, not only the next MAP item.
3. If a core is strong but weak in a bounded capability, search for the strongest implementation of that capability elsewhere.
4. Reuse, port, reimplement or graft the proven capability into the selected core in the cleanest practical way.
5. Build from zero only when mature implementations do not fit safely or bespoke Rifad work is demonstrably better.

Example:

```text
Selected Primary Core
    ├── keep strong Sales/Inventory/etc.
    ├── graft/port LAN from source B if stronger
    ├── graft/port Tables/KDS from source C if stronger
    ├── graft/port Printing from source D if stronger
    ├── attach Sync using the strongest proven topology
    └── implement/adapt Saudi ZATCA requirements
```

Source diversity is engineering provenance. The customer must experience one cohesive Rifad product.

Canonical strategy:

- `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`

---

## 4. Adapters/contracts are tools, not doctrine

Do not add abstraction merely to satisfy a pattern.

If Rifad selects and directly controls/modifies a Primary Core, direct core modification is allowed when it is safer and simpler.

Use a contract/facade/adapter when it provides concrete value, for example:

- insulating Rifad UI from an engine likely to change;
- isolating an external provider/SDK;
- LAN/Sync/Hardware/ZATCA protocol translation;
- preventing external IDs/errors/types from contaminating unrelated product code;
- enabling useful conformance/replacement testing.

Do not create a second shadow business engine or mandatory adapter layer solely to claim that the core is "Rifad-owned".

---

## 5. Capability build method — binding

Substantial capabilities follow the owner-approved `G0–G8` maturity method:

- **G0** — Authority & Scope
- **G1** — Product Discovery
- **G2** — Contract/Execution Seam Draft
- **G3** — Mock Ceiling
- **G4** — Frontier / Core / Donor Search + Simulation
- **G5** — Adoption Decision
- **G6** — Refine Boundary + Implement
- **G7** — Conformance / Failure Evidence
- **G8** — Production Evidence

Canonical method:

- `docs/architecture/RIFAD_BUILD_METHOD.md`
- `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`

### Mock Ceiling

Mocks/staging code may be used for UX and behavior discovery.

Do **not** silently grow a mock into the production engine when work crosses into a real:

- state machine;
- financial ledger;
- durable lifecycle;
- concurrency/conflict mechanism;
- production offline/retry engine;
- hardware/protocol implementation;
- schema migration/persistence engine;
- security-critical behavior;
- fiscal/regulatory authority.

At that point stop and perform G4 search/simulation first.

### Production meaning

A working screen, existing code, many green tests, or a clean restart does **not** by itself mean Production-Proven.

Existing Rifad work is evidence and may win as `KEEP-RIFAD`, but receives no sunk-cost preference.

---

## 6. Current repository roles

### `rifad-004`

Repository: `mhmdacs-collab/rifad-004`

Treat this repository as both:

1. valuable executable/product-discovery evidence; and
2. a source of experiments/staging architecture that must **not** automatically constrain the future Primary Core.

Preserve from it where useful:

- approved product/UX decisions;
- UI behavior and manifests;
- Front Office acceptance scenarios;
- customer/credit/debt behavior;
- restaurant/table SENT/PENDING invariants;
- delivery/payment product decisions;
- authorization/configuration discoveries;
- offline/idempotency test vectors;
- sync research and candidate evidence;
- useful code that wins evidence-based comparison.

Do **not** require a future core to reproduce accidental staging architecture simply because `rifad-004` implemented it first.

### Future Core Lab

A clean `rifad-core-lab` repository is the next strategic workspace for Primary Core discovery/simulation.

The GitHub connector used by the current session cannot create a repository, and the authorized remote-desktop route was unavailable when last attempted. Until the empty repository exists, its exact bootstrap is staged under `bootstrap/rifad-core-lab/` on the architecture-foundation branch.

The lab is intended for candidate source/build/runtime evidence, simulations, benchmarks, licenses, scorecards and decisions — not for prematurely building the production product.

A final clean production repository should be created only after the Primary Core decision is evidence-backed.

---

## 7. Current `rifad-004` state

### Product/map state

- MAP-00: PASS.
- MAP-01: PASS.
- MAP-02 (Shift + Cash Drawer Ledger + Time Clock): **not started**.
- The old implementation map remains useful as product/dependency history, but do not automatically begin MAP-02 while the Primary Core strategy is being reassessed.

Detailed current execution record:

- `docs/implementation/CURRENT_EXECUTION_STATUS.md`
- `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`

### Front Office branch / PR

Latest accepted Front Office foundation checkpoint from the previous lane:

- branch: `agent/frontoffice-regression-finalization`
- checkpoint SHA: `16958648b9f4e1db12ab121b74ae50bfd741cd85`
- PR #4 targets `agent/rifad-frontoffice-final-ui`
- last verified status: **Draft / Open / Unmerged**

Do not merge PR #4 without explicit owner approval.

Detailed handoff:

- `docs/CURRENT_WORK_HANDOFF_2026-08-21.md`
- `docs/ui/UI_PROGRESS.md`
- `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`

### Architecture-foundation branch

Current architecture/sourcing work is being recorded on:

- `agent/rifad-capability-gates-foundation`

This branch contains the owner-approved capability gates and Primary Core + Capability Grafting strategy.

Before any write, verify the live branch/PR state rather than trusting this snapshot if time has passed.

---

## 8. Current strategic task

**Current task is not MAP-02 implementation.**

The next strategic job is:

> **Primary Core Candidate Discovery & Architecture Simulation against the full Rifad/Loyverse-parity horizon**

Before committing to another production engine path:

1. Build a longlist of serious open-source Primary Core candidates.
2. Filter by licensing, maintenance, buildability and architectural fit.
3. Shortlist the strongest candidates.
4. Clone/build/run serious candidates where practical.
5. Inspect source, tests, database, transaction model and failure behavior.
6. Simulate each candidate against Rifad's expected topology and complete parity horizon.
7. Record `KEEP / MODIFY / REPLACE / GRAFT` by major capability.
8. Compare adaptation cost and long-term risk against the current Rifad engine path.
9. Only then select or reject a Primary Core.

Simulation must consider at least:

- coverage toward the adopted Loyverse functional/workflow baseline;
- money precision/rounding;
- transaction integrity;
- sales/orders;
- products/options/modifiers;
- inventory;
- shifts/cash drawer;
- payments/refunds;
- taxes;
- customers/credit/loyalty;
- restaurant/tables/open orders;
- KDS/CDS implications;
- local persistence/restart/crash;
- concurrency/multi-device;
- LAN;
- API/extensibility;
- database/schema evolution;
- offline behavior;
- branch/device identity;
- future sync topology;
- printing/hardware;
- permissions/security;
- multi-branch/tenant needs;
- accounting where useful;
- ZATCA feasibility;
- performance/data volume;
- maintenance/tests/failure evidence;
- licensing/redistribution/modification rights.

Do not select the first candidate that runs.

---

## 9. Product behavior authority

Loyverse is the primary observable functional/workflow/ergonomic baseline and the approved first-horizon parity target, not a code source or required internal architecture.

The objective is to account for **100% of the adopted observable baseline** before declaring the baseline complete. Track unsupported behavior explicitly; do not let missing flows disappear merely because the current Core lacks them.

Rifad's UI, visual identity and customer experience remain Rifad-owned, and Saudi-specific requirements may intentionally differ.

For detailed product behavior use:

- `docs/research/loyverse/`
- `docs/ui/UI_EXECUTION_MANIFEST.json`
- `docs/ui/UI_PROGRESS.md`
- `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`
- `docs/research/restaurant-pos/`

Do not infer proprietary Loyverse internals that are not observable/documented.

---

## 10. Current high-value technical evidence

Do not discard previous research merely because the architecture strategy evolved.

Especially preserve/reuse:

### Sync research

- `docs/research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md`
- `docs/research/sync/SYNC_CANDIDATE_SCORECARD_2026-08-18.md`
- `docs/research/sync/SYNC_CANDIDATE_EXECUTION_2026-08-18.md`

This is strong prior evidence for how Rifad should evaluate candidates: compare, execute, break, retry and score before selection.

### Local persistence evidence

- `docs/architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md`

Current BrowserLocalPersistence/outbox work is staging evidence, not a mandatory future database architecture.

### Restaurant/front-office evidence

- `docs/CURRENT_WORK_HANDOFF_2026-08-21.md`

Current SENT/PENDING behavior and table regression tests are valuable product invariants, not proof that the current restaurant mock must become the final engine.

---

## 11. Mandatory start protocol for a new AI/chat session

A fresh session must:

1. Read this file completely.
2. Read `PROJECT_RULES.md`.
3. Read `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`.
4. Read `docs/architecture/RIFAD_BUILD_METHOD.md`.
5. Read the Loyverse parity target/product requirements when evaluating any Core or capability with product impact.
6. Read only the current-task detail documents needed for the requested work.
7. Verify live GitHub branch/PR/head state before making repository changes.
8. Recover the current task from repository evidence instead of asking the owner to repeat project history.

Before substantive work, the fresh session should be able to summarize in a few lines:

- current product objective, including Loyverse-parity first horizon;
- owner vs technical responsibility;
- Primary Core + grafting strategy;
- current repository/PR state;
- current strategic task;
- any genuine unresolved blocker.

Ask the owner only for a decision that cannot be recovered from repository authority or that genuinely changes product intent.

---

## 12. Authority order and conflict handling

When documents conflict, use this order unless a newer explicit owner decision says otherwise:

1. explicit current owner decision;
2. this `AI_PROJECT_ENTRYPOINT.md` for current direction/session continuity;
3. `PROJECT_RULES.md`;
4. product target / Loyverse parity target;
5. `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`;
6. `docs/architecture/RIFAD_BUILD_METHOD.md`;
7. current architecture decisions / current execution status;
8. final implementation map for dependency history;
9. capability-specific current specs/evidence;
10. historical proposals/research as evidence only.

Do not silently rewrite a higher-authority rule to make a local task easier. Surface the conflict.

---

## 13. Continuity update rule

This file must remain current.

Update `AI_PROJECT_ENTRYPOINT.md` in the **same repository change** whenever any of these materially changes:

- Primary Core selection/rejection;
- current strategic task;
- active production/lab repository role;
- owner/AI responsibility split;
- product parity target;
- sourcing philosophy;
- authority order;
- a major branch/PR becomes the new continuation point;
- a major architecture gate becomes PASS/obsolete/replaced.

Do not update this file for trivial implementation details.

The goal is simple:

> **A new conversation should never require Mohammed to explain Rifad from the beginning again.**
