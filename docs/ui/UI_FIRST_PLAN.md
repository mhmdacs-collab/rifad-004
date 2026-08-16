# Rifad UI-First Plan

## Goal

Close the product-interface problem first without coupling the interface to unfinished backend implementations.

The first implementation phase builds all primary Rifad surfaces using Rifad-owned contracts and mock adapters.

## Live execution status

This file defines the plan. The actual implementation state, verified work, visual-approval status, known gaps and exact current checkpoint are maintained in [`UI_PROGRESS.md`](./UI_PROGRESS.md).

Do not infer completion from this plan alone; use the progress record to distinguish implemented, behavior-tested, visually verified and still-pending work.

## Surfaces

1. POS
2. Back Office
3. Dashboard
4. KDS
5. Customer Display

The detailed Loyverse behavior/reference material stored in `docs/research/loyverse/` is the primary functional/workflow evidence. `UI_EXECUTION_MANIFEST.json` converts that evidence into the IDs and ready scopes that implementation may use.

## Technology baseline

- React
- TypeScript
- Vite
- PWA for tablet/mobile installation
- Windows desktop application shell around the same UI

Technology exists to serve the interaction model; it must not force the UI to look like a generic web dashboard.

## UX acceptance rule

> If the installed tablet experience looks like a website, it fails.

Required qualities:

- standalone/full-screen installed experience where supported;
- no browser-style page layout assumptions;
- tablet-first dimensions and density;
- immediate pressed/selected/disabled states;
- touch-sized controls;
- swipe/drag/long-press only where the product workflow benefits from them;
- dialogs, sheets, drawers and navigation that behave as application surfaces;
- RTL and LTR from the beginning;
- responsive phone/tablet/desktop layouts without turning POS into a generic responsive website;
- offline-loadable application shell;
- keyboard/mouse support on Windows without degrading touch interaction.

## Authority model

- Loyverse research is the primary functional/workflow reference: hierarchy, density baseline, ticket/product relationships, navigation, modal flows, states and KDS/CDS operational behavior.
- Rifad's design system is the visual authority: identity, tokens, typography, icons, assets, accessibility and final component styling.
- Other interfaces may influence a narrow visual pattern only through an explicit approved record under `visual-decisions/`.
- Visual improvement may not silently change workflow, action meaning, contract, permissions, offline behavior or fiscal/payment state.

See `DESIGN_AUTHORITY.md`.

## Manifest implementation gate

Screen-family lists below are discovery scope, not permission to invent screens. A coding task must name a `ready` screen or flow from `UI_EXECUTION_MANIFEST.json` and may implement only its declared actions/states.

If required behavior is missing or only `mapped`, update the evidence and manifest before writing the UI.

## Contract-driven mocks

Every screen action calls a contract from day one.

Example:

```text
UI button: Add branch
        ↓
BranchContract.create(input)
        ↓
MockBranchAdapter (phase 1)
        ↓
Real Branch adapter (later)
```

The UI does not change when the mock is replaced.

## Phase 1 screen families

### POS

- employee/PIN entry
- sales workspace
- product/category navigation
- current ticket
- modifiers/variants
- customer selection
- discounts/taxes
- open tickets
- restaurant table/floor flows
- payment and split payment surfaces
- receipts/refunds
- shifts/cash movements
- item management shortcuts
- device settings

### Back Office

- stores/branches
- POS devices
- items/categories/modifiers
- inventory/purchasing/transfers/counts
- customers/loyalty
- employees/roles/permissions
- reports
- taxes/payment types
- integrations/settings

### Dashboard

- sales summary
- comparison periods
- inventory alerts
- branch summary
- owner-level operational indicators

### KDS

- incoming tickets
- category/station routing presentation
- item/order completion
- recall
- elapsed time and status
- offline/LAN state presentation

### CDS

- cart/ticket presentation
- totals/tax/discount
- customer-facing payment state
- receipt/contact flow where applicable
- disconnected/reconnect state

## Definition of UI phase complete

UI phase is complete only when:

1. every documented primary screen has a stable manifest ID and reaches `verified`;
2. principal manifest flows can be completed end-to-end with mock data;
3. every business action crosses a Rifad contract;
4. no domain logic is buried in view components;
5. RTL/LTR work on target layouts;
6. installed PWA presentation feels app-like;
7. Windows shell can host the same application UI;
8. visual regression coverage exists for major screens/states;
9. mock adapters can be individually replaced without restructuring the UI.
10. every visual donor pattern in use has an approved decision and linked regression evidence.

## What is explicitly not part of UI phase

- repairing donor applications;
- binding Rifad to Odoo/FloCafe internals;
- implementing final synchronization before its contract is known from the UI/product workflows;
- premature cloud infrastructure;
- creating duplicate native UIs merely to obtain a native appearance.

The UI phase produces a complete interactive Rifad product shell and a concrete shopping list of backend/module contracts.
