# Current Rifad Decisions

Last updated: 2026-08-17

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

## D-017 — POS is touch-first and human-scaled

For cashier-facing POS work, the design priority is:

> **Touch first, then human visual clarity, then beauty.**

This means frequent controls retain practical touch targets across device sizes. When a screen becomes constrained, Rifad changes layout, density, wrapping, scrolling or column count before shrinking important targets into desktop-sized controls.

Visual scale is judged from real human viewing distance and cashier task frequency, not from screenshot symmetry or design-tool neatness.

Detailed rules live in `docs/ui/DESIGN_AUTHORITY.md`.

## D-018 — Every visible durable field must be traceable before database implementation

Rifad will not wait for database implementation to discover what the UI needs to persist.

`docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` is the current POS traceability register for:

- canonical cashier-facing terminology;
- fields already present in Rifad models/contracts;
- UI-required fields that are still missing from durable data;
- reserved integration fields;
- derived values;
- presentation-only state that should not become database truth.

When a new durable field, option, status or payment fact becomes visible, the register must be updated in the same product/implementation change.

## D-019 — Checkout preserves cashier spatial context

The accepted POS checkout direction keeps the product catalog visible and transforms the basket rail through checkout rather than navigating the cashier to unrelated full-page surfaces.

The conceptual progression is:

`basket → payment methods → cash/card → success`

The catalog remains visible as frozen context during checkout. This is an interaction decision; the business contracts still own sale/payment state.

## D-020 — Mock payment UX is not production terminal support

Rifad may implement a mock `card` / **شبكة / مدى** path to validate payment-method selection, touch layout, receipt shape and success behavior.

A working mock card flow does **not** mean Rifad supports a real Mada/payment terminal.

Production integrated-payment support requires a proven provider/terminal adapter, durable payment records, failure/decline/recovery behavior, reconciliation/refund requirements, security review and capability evidence.

The current card UX extension must remain distinguishable from certified production terminal support in documentation and product claims.

## D-021 — Frequent primary actions stay outside scrolling content

Cashier-facing completion actions should occupy a stable action/footer region within their operational surface rather than moving with long content.

Examples include **دفع**, **سداد**, **طباعة الإيصال**, **بيع جديد** and equivalent confirmation actions.

The intended composition is:

`scrollable/repeatable content → required summary/context → stable primary-action footer`

Consequences:

- item lists, history, optional form fields and other repeatable content absorb scrolling first;
- shorter screens change spacing, columns or content density before hiding the primary action behind a normal-path scroll;
- totals, tax, change or remaining balance may stay immediately adjacent to the footer when they are required to make the final decision;
- dynamic validation near a repeated keypad must reserve stable geometry so state changes do not move the keys or completion action;
- the footer is fixed within the relevant panel/dialog/rail, not blindly fixed to the browser viewport.

This is an interaction/layout decision and does not change the underlying business command or persistence semantics.