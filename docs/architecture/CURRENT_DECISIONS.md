# Current Rifad Decisions

These decisions supersede earlier architecture proposals stored under `open_source/` when they conflict.

## D-001 — Rifad owns the core

Rifad is not built as a branded shell over a donor POS/ERP. External systems may supply modules, algorithms or adapters, but they do not define Rifad's contracts or product ownership.

## D-002 — UI-first

The first implementation focus is the complete interactive product shell: POS, Back Office, Dashboard, KDS and CDS. Missing backend capabilities are represented by mock adapters behind real Rifad contracts.

## D-003 — Primary UI stack

Use React + TypeScript + Vite for the primary interface. The same product UI is hosted in a desktop application shell on Windows and installed as a PWA on supported tablet/mobile platforms.

## D-004 — Loyverse as product reference

Loyverse is the primary UX/workflow reference. Rifad independently implements the experience using Rifad branding and Rifad-owned code/contracts.

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

Existing `Loyverse_Info/` and `open_source/` material is retained as research evidence. Statements such as “Odoo is the fixed core” are historical proposals, not current binding architecture.