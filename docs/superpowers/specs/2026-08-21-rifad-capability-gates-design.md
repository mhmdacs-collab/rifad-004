# Rifad Capability Gates Design

Status: **OWNER-APPROVED DESIGN**

Date: 2026-08-21

## Purpose

Rifad already has a strong architectural direction, but executable mocks, staging adapters and draft contracts can be mistaken for production-ready engines if there is no mandatory promotion process between UI discovery and durable implementation.

This design adds that missing process without discarding existing work or changing the dependency order in `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`.

The map answers **what Rifad builds and in what dependency order**. The capability gates answer **how a capability is allowed to mature from discovery to production**.

## Approved maturity dimensions

Every substantial capability is evaluated independently on these dimensions:

1. Product / UX
2. Rifad Contract
3. Frontier / Donor Evidence
4. Implementation
5. Durability / Offline
6. Conformance / Failure Evidence
7. Production Evidence

Allowed maturity labels are:

- `NONE`
- `DISCOVERY`
- `PROVEN-STAGING`
- `PRODUCTION-PROVEN`

A capability must not receive one misleading overall percentage. Different dimensions may be at different maturity levels.

## Capability gates

### G0 — Authority and scope

Define the bounded capability, owner of truth, dependency-map position, allowed scope and explicit non-goals before implementation.

### G1 — Product discovery

Use the approved product baseline, mature product behavior and Rifad requirements to determine user flows, states, actions, errors, permissions, offline expectations and acceptance scenarios.

UI and mock adapters are allowed here when they are useful for discovering behavior.

### G2 — Rifad contract draft

Draft Rifad-owned commands, queries, DTOs, stable identities, errors, state transitions, data ownership and idempotency/offline semantics as applicable.

This contract is a candidate, not yet sacred or frozen.

### G3 — Mock Ceiling

Before extending a mock, ask whether the work is still product/UX discovery or has crossed into a real engine.

A mock may continue for UI behavior and bounded interaction proof. It must stop being extended as the production path when the next work requires a substantial state machine, financial ledger, durable lifecycle, concurrency/conflict logic, offline/retry mechanics, hardware/protocol integration, persistent migrations, security-critical behavior or fiscal/regulatory logic.

Crossing this ceiling requires G4 before implementation continues.

### G4 — Frontier / Donor Gate

Research the strongest mature implementations per bounded slice, not only whole applications. For substantial capabilities compare at least two credible implementations, and more when the ecosystem is rich.

Inspect actual source, tests, failure cases, issues, maintenance, persistence/restart behavior, invariants, dependency/license fit and relevant security/hardware/regulatory evidence.

The current Rifad implementation is also a candidate and receives no automatic preference merely because work has already been invested in it.

### G5 — Adoption decision

For each useful slice choose exactly one disposition:

- `DIRECT-REUSE`
- `PORT-REIMPLEMENT`
- `BEHAVIORAL-REFERENCE`
- `KEEP-RIFAD`
- `REJECT`

Do not adopt an entire donor application merely because one slice is useful. Different slices may come from different evidence sources and are composed only inside Rifad-owned boundaries.

### G6 — Contract freeze candidate and implementation

Refine the draft Rifad contract using product evidence and donor characterization. Only then promote it to a freeze candidate and implement or adapt the selected slice behind Rifad-owned core/adapter boundaries.

UI and unrelated domains continue depending only on Rifad contracts. Donor schemas, IDs, SDK types, errors and lifecycle details do not cross the boundary.

### G7 — Conformance gate

Promote important behavioral invariants into Rifad-owned contract/conformance tests that can run against the mock, selected implementation and future replacement implementations.

Tests must express product behavior and failure invariants rather than merely protecting one implementation's internals.

### G8 — Production evidence

A capability reaches `PRODUCTION-PROVEN` only when evidence appropriate to its risk exists.

Examples:

- low-risk helpers: unit/conformance and license evidence;
- local persistence: restart, crash/interruption, corruption, migration, capacity/performance and host proof;
- printing/hardware: supported media/device matrix, Arabic/QR/logo fixtures, disconnect/reconnect and physical-device evidence;
- payments: decline, timeout, unknown result, retry, duplicate prevention, reconciliation/refund and security evidence;
- synchronization: durable replay, duplicate prevention, conflict policy, isolation, migration, recovery and operational/security evidence;
- ZATCA/fiscal: official specifications/vectors, certificate/state lifecycle, retry/acknowledgement/rejection and audit evidence.

## Contract refinement rule

Rifad contracts are owned by Rifad, but draft contracts are not protected from learning.

Correct sequence:

`Rifad product behavior → Contract Draft → Frontier/Donor knowledge → Refined Rifad Contract → Freeze Candidate → Implementations`

Incorrect sequence:

`Early mock interface → force every future implementation to preserve accidental early assumptions`

Donor knowledge may reveal missing concepts, but donor schemas never become Rifad public contracts automatically.

## Relationship to existing work

This design does not invalidate current mocks, tests or staging implementations. Existing work is classified by maturity and used as evidence:

- strong product behavior and regression tests are retained;
- staging contracts remain useful draft seams;
- strong Rifad implementations may win G5 as `KEEP-RIFAD`;
- weak implementations may be replaced without rewriting product surfaces if the Rifad boundary remains correct.

There is no sunk-cost promotion rule.

## Application to map items

A map item may be decomposed internally into gate-driven slices. For example MAP-02 may proceed as:

- MAP-02A product/behavior characterization;
- MAP-02B Rifad contract drafts;
- MAP-02C frontier/donor research;
- MAP-02D adoption decisions;
- MAP-02E implementation;
- MAP-02F conformance + offline workday proof.

This decomposition does not change MAP-02's dependency position in the final implementation map.

## Scope of this design

This design establishes capability maturity gates and the Mock Ceiling only.

It does **not** yet define the separate session-start/Codex operating protocol, AI project entrypoint, capability maturity matrix file format, or any production implementation for MAP-02 or later capabilities.
