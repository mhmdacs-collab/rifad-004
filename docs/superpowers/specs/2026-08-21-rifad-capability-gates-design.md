# Rifad Capability Gates Design

Status: **OWNER-APPROVED DESIGN — RECONCILED WITH PRIMARY CORE STRATEGY**

Date: 2026-08-21

## Purpose

Rifad needs a promotion process that prevents two opposite mistakes:

1. treating mocks/staging code as production merely because it exists;
2. rebuilding mature engines from zero merely because an earlier architecture assumed every capability must be Rifad-authored and separately adapted.

The owner has clarified the implementation philosophy:

> Rifad owns the product and customer experience. The underlying core may be a mature open-source engine if evidence shows it is the strongest practical foundation. Once a primary core is selected, weak/missing capabilities may be grafted, ported or reimplemented from other proven sources.

This design therefore combines capability maturity gates with whole-core sourcing and capability grafting.

## Owner / AI responsibility split

- The product owner defines customer needs, workflows, visible behavior and product priorities.
- The AI/technical lead is responsible for finding and comparing the strongest implementation foundations and capability sources, simulating future fit before implementation, and avoiding unnecessary green-field rebuilding.
- UI quality and customer behavior are not evidence that the underlying engine is production-ready.
- Engine authorship is not a product goal. Stability, correctness, capability, maintainability and control are.

## Maturity dimensions

Every substantial capability is evaluated independently on:

1. Product / UX
2. Boundary / Contract
3. Frontier / Source Evidence
4. Implementation
5. Durability / Offline
6. Conformance / Failure Evidence
7. Production Evidence

Allowed labels:

- `NONE`
- `DISCOVERY`
- `PROVEN-STAGING`
- `PRODUCTION-PROVEN`

No single percentage is allowed to hide weak dimensions.

## Capability gates

### G0 — Authority and scope

Define the bounded product outcome, dependency-map position, allowed scope, non-goals and risk lane. State whether the decision may affect the Primary Core.

### G1 — Product discovery

Use mature product behavior, Saudi requirements and Rifad product decisions to determine flows, states, actions, errors, permissions, offline expectations and acceptance scenarios.

UI/mocks are allowed for discovery.

### G2 — Boundary draft

Draft the minimum deliberate execution seam and durable meanings. The seam may later be a Rifad contract, thin facade, native core extension seam or another controlled boundary.

Do not freeze accidental mock shapes.

### G3 — Mock Ceiling

Stop extending the mock as a production path when work crosses into substantial state machines, financial ledgers, durable lifecycles, concurrency/conflicts, production offline/retry, hardware/protocols, migrations, security or fiscal authority.

Crossing G3 requires sourcing/simulation before real engine implementation.

### G4 — Frontier, Core and Source Simulation Gate

G4 has two valid levels.

#### Whole-core evaluation

When Rifad has not explicitly selected a Primary Core, or when a foundation decision materially affects future architecture, compare serious mature engines as whole systems.

Inspect and simulate as applicable:

- money/rounding;
- transaction integrity;
- sales/orders;
- inventory;
- shifts/cash;
- payments/refunds;
- taxes;
- restaurant/tables;
- local persistence/restart/crash;
- concurrency/multi-device;
- LAN;
- API/extensibility;
- database/migrations;
- offline;
- sync attachment;
- printing/hardware;
- security/permissions;
- branch/tenant behavior;
- accounting;
- ZATCA attachment feasibility;
- performance;
- maintenance;
- licensing.

For every serious candidate simulate what Rifad would retain, modify, graft and own before adoption.

#### Capability source evaluation

After a Primary Core is selected, or for a clearly bounded gap, compare mature implementations for that capability. Include the selected core's native solution, current Rifad code and external sources where relevant.

Examples: LAN, Tables, KDS, Printing, Sync, Payment provider state, local persistence, fiscal behavior.

### G5 — Selection

Whole-core decisions:

- `ADOPT-PRIMARY-CORE`
- `KEEP-CURRENT-CORE`
- `CONTINUE-RESEARCH`
- `REJECT`

Capability decisions:

- `DIRECT-REUSE`
- `PORT-REIMPLEMENT`
- `BEHAVIORAL-REFERENCE`
- `KEEP-CORE`
- `KEEP-RIFAD`
- `EXTERNAL-SERVICE`
- `REJECT`

Past effort is not a selection criterion.

### G6 — Integration and boundary refinement

Integration style is evidence-driven. Valid approaches include direct core modification, native plugin/extension, thin facade, adapter, internal module or sidecar/service.

Adapters are a tool, not a doctrine. Do not add them without concrete isolation/translation/replacement value.

### G7 — Conformance and failure evidence

Promote important Rifad behavior and failure cases into tests/evidence. For replaceable/grafted capabilities, keep conformance implementation-independent where practical.

### G8 — Production evidence

Production status requires evidence appropriate to the risk: restart/crash, migrations, hardware, capacity, security, ambiguous-result recovery, duplicate prevention, conflict policy, fiscal official vectors, etc.

## Primary Core + grafting principle

The preferred architecture may be:

`Rifad UX/Product → selected Primary Core → retained native capabilities + grafted stronger capabilities + Saudi/ZATCA work`

A weak capability does not automatically invalidate a strong Primary Core. Search for a graft first.

Likewise, a broad mature core is not automatically accepted. It must pass simulation and evidence.

## Relationship to existing work

Current Rifad mocks, UI and tests remain valuable evidence. They may survive even if a different Primary Core is selected.

- UX behavior can be retained.
- Regression/conformance cases can be retained.
- Current Rifad engine code may win as `KEEP-CURRENT-CORE` or `KEEP-RIFAD` if evidence supports it.
- Weak engine code may be replaced without treating previous effort as authority.

## Application to MAP items

MAP order remains intact, but implementation does not begin automatically just because an item is next.

For example, before authoritative Shift/Cash implementation, Rifad may first evaluate whether a mature Primary Core already solves shifts/cash/inventory/payments/tables strongly enough to save months and reduce risk.

Once a Primary Core is selected, later MAP items use capability grafting for its gaps instead of re-running whole-core selection for every feature.

## Scope

This design establishes:

- G0–G8;
- Mock Ceiling;
- whole-core sourcing;
- architecture simulation before adoption;
- capability grafting;
- adapters as optional tools rather than mandatory ceremony.

It does not yet select the winning Primary Core, define the Codex session-start protocol, or authorize MAP-02 implementation.
