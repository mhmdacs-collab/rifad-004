# Current Rifad Decisions

These decisions supersede earlier architecture proposals stored under `docs/research/historical-proposals/` when they conflict.

## D-001 — Rifad owns the core

Rifad is not built as a branded shell over a donor POS/ERP. External systems may supply modules, algorithms or adapters, but they do not define Rifad's contracts or product ownership.

## D-002 — UI-first

The UI phase target is the complete interactive product shell: POS, Back Office, Dashboard, KDS and CDS. It is delivered through manifest-gated vertical flows. Missing backend capabilities are represented by mock adapters behind real Rifad contracts.

## D-003 — Primary UI stack

Use React + TypeScript + Vite for the primary interface. The same product UI is hosted in a desktop application shell on Windows and installed as a PWA on supported tablet/mobile platforms.

## D-004 — Loyverse as functional/workflow reference

Loyverse is the primary functional/workflow reference for screen inventory, interaction meaning, states, prerequisites and operational flows. Rifad independently implements the experience using Rifad branding and Rifad-owned code/contracts.

## D-005 — Puzzle modules

Capabilities are replaceable modules behind stable contracts. Donor language/framework does not determine Rifad architecture.

## D-006 — Donor projects are not repaired for their own sake

If extracting a useful capability requires broad donor repairs, evaluate another donor or reimplement the characterized behavior.

## D-007 — Local-first

Offline-capable POS operation, durable local state, idempotency and synchronization are core design requirements. Exact implementation is selected behind Rifad-owned contracts.

## D-008 — ZATCA is core

Saudi fiscal compliance is a first-class Rifad domain. It may use/adapt proven implementations and official specifications but remains behind a Rifad fiscal contract.

## D-009 — Accounting is replaceable

Odoo, ERPNext or other accounting/ERP engines may be connected through adapters. None is the owner of the finalized Rifad local sale contract by default.

## D-010 — Historical research stays available

Existing Loyverse and open-source material is retained under `docs/research/` as research evidence. Statements such as “Odoo is the fixed core” are historical proposals, not current binding architecture.

## D-011 — Donor composition happens inside Rifad

When multiple donors solve different parts of a capability, their selected logic is composed behind Rifad-owned contracts/core/adapters. One donor is never promoted to the integration base merely because it supplied the first implementation.

## D-012 — Existing code is an accelerator, not authority

Rifad starts from proven implementations, tests, protocols and failure evidence whenever practical. A donor slice is adopted only after execution, source/test inspection, license verification and Rifad conformance validation.

## D-013 — Support is a tested capability matrix

Rifad does not promise “any device” or “any integration” without evidence. Hardware and external-system support is published as explicit protocol/model/capability combinations backed by tests. Generic standards support and certified devices are reported separately.

## D-014 — UI implementation is manifest-gated

Every screen, action, state and end-to-end flow receives a stable ID linked to source evidence. Code may start only for a `ready` screen or the explicitly bounded subset of a `ready` flow. Missing behavior is resolved in the manifest before implementation.

## D-015 — Rifad owns visual authority

Rifad's design system owns final visual tokens, assets and component styling. Loyverse remains the functional/workflow and ergonomic baseline. Another interface may influence a narrow pattern only after an explicit visual decision; it cannot silently change logic or flows.

## D-016 — Build vertical flows, not disconnected screen museums

Implementation milestones prove an end-to-end user outcome through mocks. The first authorized milestone is `POS-FLOW-001`, a retail cash sale slice spanning entry, PIN, sales, cash payment, success and a new sale.
