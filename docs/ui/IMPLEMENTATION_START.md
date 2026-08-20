# First Implementation Target

Last updated: 2026-08-17

## Status note

This document records the **original first executable target**. It is intentionally narrower than the current active POS branch.

For the actual current implementation state, owner-reviewed visual direction, mock card extension and known data gaps, use:

- `UI_PROGRESS.md`
- `POS_UI_NAMING_AND_FIELD_REGISTER.md`
- `DESIGN_AUTHORITY.md`

Do not treat later branch experiments as if they had always been part of this original authorization.

## Objective

Create the first executable Rifad vertical slice, `POS-FLOW-001`, from a clean codebase. Do not import FloCafe/Odoo application structure or implement behavior outside the manifest scope.

## Scope

Start with the POS tablet/desktop/phone shell because it establishes the design system and interaction grammar used by the other surfaces.

Required first slice:

- `POS-SCREEN-001` existing-account sign-in for a mock unlinked device;
- `POS-SCREEN-002` employee PIN unlock;
- the permitted `POS-SCREEN-003` subset: fixed-price catalog/search/current ticket/quantity/delete;
- `POS-SCREEN-007` cash payment-method selection;
- `POS-SCREEN-008` cash tender and change;
- `POS-SCREEN-011` success, mock print states and New sale;
- responsive RTL/LTR behavior;
- desktop keyboard/mouse usability;
- installable PWA shell;
- only the draft contracts/mock adapters named by `POS-FLOW-001`.

The ordered steps, actions, states, non-goals and acceptance criteria live in `UI_EXECUTION_MANIFEST.json` and `flows/POS-FLOW-001.md`.

## Non-goals of the original first slice

- no donor backend integration yet;
- no final local database schema yet;
- no cloud synchronization implementation yet;
- no Odoo/FloCafe binding;
- no generic admin-template UI;
- no business rules embedded in components;
- no modifiers/variants, customers/loyalty, discounts, open-ticket management, tables, production integrated payments or split payments in this original slice;
- no unapproved visual donor patterns.

The active UI branch has since grown beyond this first slice for product validation. That does not redefine the original scope; later work must remain documented in the living progress record and manifest/product decisions.

## Acceptance

The slice passes only when it is visibly an operational POS application rather than a web dashboard, every permitted action is routed through its named Rifad contract/mock, and all `POS-FLOW-001` acceptance criteria are evidenced.

The current POS interaction authority additionally requires **touch first, then human visual clarity, then beauty**; see `DESIGN_AUTHORITY.md`.
