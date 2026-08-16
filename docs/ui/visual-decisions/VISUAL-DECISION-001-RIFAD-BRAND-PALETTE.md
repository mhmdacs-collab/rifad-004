# VISUAL-DECISION-001 — Rifad Brand Palette and Logo Variants

## Status

Approved for `POS-FLOW-001`.

## Source

- User-supplied official light logo: `apps/pos/public/brand/rifad-logo-light.png`.
- User-supplied official dark logo: `apps/pos/public/brand/rifad-logo-dark.png`.
- Inspected on 2026-08-16.

## Decision

- Rifad primary green is `#0A714E`, sampled from the solid logo mark in both supplied files.
- The former provisional cyan `#16BAD3` is rejected and must not appear in Rifad UI.
- Use the light logo variant on white/light surfaces.
- Use the dark logo variant on black/dark surfaces.
- Compact application chrome may crop the supplied square image to the symbol, but may not recolor or redraw the mark.
- Rifad green is the primary action/selection color; it is not used as a large decorative fill when that harms readability.

## Derived execution tokens

- Primary dark: `#07543B`.
- Primary soft: `#E8F3EF`.
- Text/surface/status tokens remain listed in `docs/ui/RIFAD_DESIGN_TOKENS.json`.

Derived shades are implementation tokens, not new logo colors.

## Affected IDs

- `POS-FLOW-001`.
- `POS-SCREEN-001`.
- `POS-SCREEN-002`.
- `POS-SCREEN-003`.
- `POS-SCREEN-007`.
- `POS-SCREEN-008`.
- `POS-SCREEN-011`.

## Functional boundary

This decision changes only Rifad visual identity. Loyverse-derived workflow, layout hierarchy, action meaning, contracts, money and offline behavior remain unchanged.
