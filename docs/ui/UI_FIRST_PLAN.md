# Rifad UI-First Plan

Last updated: 2026-08-17

## Goal

Close the product-interface problem first without coupling the interface to unfinished backend implementations.

The UI phase builds primary Rifad surfaces using Rifad-owned contracts and mock adapters, while simultaneously discovering the durable data fields the production system will require.

## Live execution status

This file defines the plan. The actual implementation state, owner-review status, known gaps and exact current checkpoint are maintained in [`UI_PROGRESS.md`](./UI_PROGRESS.md).

Canonical cashier-facing names and UI-to-data field traceability are maintained in [`POS_UI_NAMING_AND_FIELD_REGISTER.md`](./POS_UI_NAMING_AND_FIELD_REGISTER.md).

Do not infer completion from this plan alone.

## Surfaces

1. POS
2. Back Office
3. Dashboard
4. KDS
5. Customer Display

The detailed Loyverse behavior/reference material stored in `docs/research/loyverse/` is the primary functional/workflow evidence. `UI_EXECUTION_MANIFEST.json` converts that evidence into stable IDs and ready scopes.

## Technology baseline

- React
- TypeScript
- Vite
- PWA for tablet/mobile installation
- Windows desktop application shell around the same UI

Technology exists to serve the interaction model; it must not force the UI to look like a generic web dashboard.

## UX acceptance rule

> If the installed POS experience feels like a website instead of a cashier application, it fails.

The current binding POS priority is:

> **Touch first, then human visual clarity, then beauty.**

Required qualities:

- standalone/full-screen installed experience where supported;
- no browser-style page-layout assumptions;
- tablet/POS-first dimensions and density;
- immediate pressed/selected/disabled states;
- frequent touch targets sized for human fingers, not mouse precision;
- layout changes before important controls are shrunk on smaller/shorter screens;
- swipe/drag/long-press only where the product workflow benefits from them;
- dialogs, sheets, drawers and navigation that behave as application surfaces;
- RTL and LTR from the beginning;
- responsive phone/tablet/desktop layouts without turning POS into a generic responsive website;
- offline-loadable application shell;
- keyboard/mouse support on Windows without degrading touch interaction;
- important money and next actions readable from normal cashier viewing distance.

## Authority model

- Loyverse research is the primary functional/workflow reference: hierarchy, density baseline, ticket/product relationships, navigation, modal flows, states and KDS/CDS operational behavior.
- Rifad's design system is the visual/interaction authority: identity, tokens, typography, icons, assets, touch ergonomics, accessibility and final component styling.
- Other interfaces may influence a narrow visual pattern only through an explicit approved record under `visual-decisions/`.
- Visual improvement may not silently change workflow, action meaning, contract, permissions, offline behavior or fiscal/payment state.

See `DESIGN_AUTHORITY.md`.

## Manifest implementation gate

Screen-family lists below are discovery scope, not permission to invent screens. A coding task must name a `ready` screen or flow from `UI_EXECUTION_MANIFEST.json` and may implement only its declared actions/states.

If required behavior is missing or only `mapped`, update evidence and manifest before the behavior is promoted as approved implementation scope.

A branch-level product experiment may exist for owner validation, but it must remain clearly labeled as an experiment/mock until manifest/product scope is reconciled. The current card/شبكة/مدى UX is one such case; see `UI_PROGRESS.md`.

## Contract-driven mocks

Every durable business action calls a Rifad contract from day one.

Example:

```text
UI button: Add branch
        ↓
BranchContract.create(input)
        ↓
MockBranchAdapter (UI phase)
        ↓
Real Branch adapter (later)
```

The visible workflow should not need to be rebuilt merely because the adapter changes.

## UI-to-data discovery rule

A UI-first phase is also a data-discovery phase.

When the interface introduces or implies a durable field, update `POS_UI_NAMING_AND_FIELD_REGISTER.md` immediately and classify it as current, required gap, reserved integration, derived, or UI-only.

Do not wait until SQL/database design to discover that the UI already depends on fields such as order type, barcode, SKU, payment references or print-job state.

Conversely, do not persist presentation-only state just because it exists in a component.

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

1. every documented primary screen has a stable manifest ID and reaches the required verified state;
2. principal manifest flows can be completed end-to-end with mock data;
3. every durable business action crosses a Rifad contract;
4. no domain logic is buried in view components;
5. RTL/LTR work on target layouts;
6. touch targets remain human-usable across large POS, 1366×768, tablet, short displays and mobile compositions;
7. installed PWA presentation feels app-like;
8. Windows shell can host the same application UI;
9. visual regression coverage exists for major screens/states;
10. mock adapters can be individually replaced without restructuring the UI;
11. every visual donor pattern in use has an approved decision and linked regression evidence;
12. every visible durable field has an entry in the UI naming/field register and known data gaps are closed or explicitly deferred.

## What is explicitly not part of UI phase

- repairing donor applications;
- binding Rifad to Odoo/FloCafe internals;
- implementing final synchronization before its contract is known from the UI/product workflows;
- premature cloud infrastructure;
- creating duplicate native UIs merely to obtain a native appearance;
- claiming a real payment-terminal integration from a mock card UX.

The UI phase produces a complete interactive Rifad product shell **and** a concrete, traceable shopping list of backend/domain fields and contracts.
