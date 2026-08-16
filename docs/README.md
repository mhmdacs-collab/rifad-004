# Rifad Documentation Map

This directory separates binding Rifad decisions from historical evidence.

## Authority order

When documents conflict, use this order:

1. `PROJECT_RULES.md` at the repository root.
2. `architecture/CURRENT_DECISIONS.md`.
3. `architecture/RIFAD_ARCHITECTURE.md`, current capability/adoption policy and UI authority policy.
4. `ui/UI_EXECUTION_MANIFEST.json` for implementation identity/readiness/scope.
5. Current UI/product plans.
6. Research and historical proposals as evidence only.

## Current implementation documents

- `architecture/` — binding architecture direction and current decisions.
- `adoption/` — how Rifad evaluates and incorporates proven external logic.
- `donors/` — donor policy and evidence record template.
- `ui/UI_EXECUTION_MANIFEST.json` — binding screen/action/state/flow inventory and readiness status.
- `ui/UI_EXECUTION_MANIFEST_SCHEMA.md` — implementation gate and required evidence.
- `ui/DESIGN_AUTHORITY.md` — functional versus visual authority and visual-donor approval policy.
- `ui/flows/` — bounded vertical slices authorized for implementation.
- `ui/` — UI-first product-surface plan, provisional tokens and first executable target.

## Research

- `research/loyverse/` — preserved product, UI and technical reference research.
- `research/historical-proposals/` — earlier Odoo/hybrid/open-source proposals retained for evidence. These proposals do not own current Rifad architecture.

Moving research here does not erase its value; it prevents old recommendations from being mistaken for current decisions.
