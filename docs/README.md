# Rifad Documentation Map

Last updated: 2026-08-17

This directory separates binding Rifad decisions from historical/research evidence.

## Authority order

When documents conflict, use this order:

1. `PROJECT_RULES.md` at the repository root.
2. `architecture/CURRENT_DECISIONS.md`.
3. `architecture/RIFAD_ARCHITECTURE.md`, current capability/adoption policy and UI authority policy.
4. `ui/UI_EXECUTION_MANIFEST.json` for implementation identity/readiness/scope.
5. `ui/DESIGN_AUTHORITY.md` for POS interaction/visual authority.
6. `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` for canonical POS labels and UI-to-data field traceability.
7. `ui/UI_PROGRESS.md` and current UI/product plans for living implementation status.
8. Research and historical proposals as evidence only.

A product/visual discussion can be documented before implementation while still remaining explicitly **not manifest-authorized**. The current restaurant local/open-order/channel direction is in that state.

## Current implementation documents

- `architecture/` — binding architecture direction and current decisions.
- `adoption/` — how Rifad evaluates and incorporates proven external logic.
- `donors/` — donor policy and evidence record template.
- `ui/UI_EXECUTION_MANIFEST.json` — binding screen/action/state/flow inventory and readiness status.
- `ui/UI_EXECUTION_MANIFEST_SCHEMA.md` — implementation gate and required evidence.
- `ui/DESIGN_AUTHORITY.md` — functional versus visual authority, touch-first/human-scale rule, responsive policy and visual-donor approval policy.
- `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` — **canonical POS terminology plus every current/missing/reserved/derived/UI-only field exposed by the interface. Update this whenever a new visible durable field is introduced.**
- `ui/UI_PROGRESS.md` — living record of implemented, owner-reviewed, pending and known-gap POS work.
- `ui/flows/` — bounded vertical slices authorized for implementation.
- `ui/visual-decisions/` — approved/current visual interaction decisions and explicitly pending owner-directed directions.
- `ui/` — UI-first product-surface plan, provisional tokens and first executable target.

## Data-model guardrail

Do not postpone UI field discovery until database design.

If the interface introduces a new field, option, payment fact, customer attribute, setting or status, update `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` in the same product/implementation change and classify it as current, required gap, reserved integration, derived, or UI-only.

This now explicitly includes restaurant concepts such as fulfillment mode, sales channel, service area/place, open-order lifecycle, channel-specific pricing and kitchen-dispatch evidence.

## Research

- `research/loyverse/` — preserved product, UI and technical reference research.
- `research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md` — current official-market comparison for direct sale, table service, open orders, kitchen routing, sales channels and channel pricing.
- `research/historical-proposals/` — earlier Odoo/hybrid/open-source proposals retained for evidence. These proposals do not own current Rifad architecture.

Moving research here does not erase its value; it prevents old recommendations from being mistaken for current decisions.
