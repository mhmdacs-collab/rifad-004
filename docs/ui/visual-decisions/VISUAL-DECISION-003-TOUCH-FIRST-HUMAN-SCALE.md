# VISUAL-DECISION-003 — Touch-First Human-Scale POS

## Status

Approved for the current POS visual direction on 2026-08-17.

## Decision

The cashier-facing design priority is:

> **Touch first, then human visual clarity, then beauty.**

This decision applies across the current POS interaction language, not only one button or one screenshot.

## Rules

- Frequent cashier controls should normally expose roughly 48 px or more usable touch area where space allows.
- Short-height screens should keep important targets around 44–48 px rather than collapsing to mouse-sized desktop controls.
- The hit area may be larger than the visible icon.
- Change layout, wrapping, scrolling, column count or secondary content before shrinking important controls.
- Whole cards/rows should be tappable when they represent one action.
- Product density does not outrank finger accuracy.
- Primary actions receive greater visual/touch weight than secondary actions.
- Important money values and next actions are judged from real cashier viewing distance.
- Whitespace is useful only when it improves scanning/reachability; it must not make important information appear undersized inside a large empty surface.

## Responsive coverage

At minimum review:

- large cashier/desktop POS;
- 1366×768-class devices;
- tablet landscape;
- short-height POS displays;
- mobile/narrow composition.

## Affected current areas

- app bar controls;
- product cards;
- sale-page tabs;
- ticket rows;
- Save/Pay hierarchy;
- payment-method cards;
- quick-cash suggestions;
- keypad;
- cash completion;
- success summary and New sale action;
- quantity editor and other frequent dialogs.

## Boundary

This decision changes ergonomic presentation and responsive composition. It does not authorize silent changes to payment semantics, money calculations, permissions, durable state or offline behavior.

## Affected IDs

- `POS-SCREEN-003`
- `POS-SCREEN-007`
- `POS-SCREEN-008`
- `POS-SCREEN-011`
- `POS-SCREEN-026`
- current POS visual work on `agent/pos-visual-pass-01`

## Verification

- automated code/manifest checks remain required;
- owner screenshot review remains required for final visual lock;
- a visually tidy result fails this decision if frequent targets are hard to hit or important money cannot be read quickly.
