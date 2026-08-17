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

A product/visual discussion can be documented before implementation while still remaining explicitly **not manifest-authorized**. Restaurant local service now has a bounded executable prototype under `POS-FLOW-002`; online-order/delivery connector implementation remains pending separate scope.

## Current implementation documents

- `architecture/` — binding architecture direction and current decisions.
- `architecture/POS_RUNTIME_ADAPTER_BOUNDARY.md` — current general POS runtime composition/injection boundary and replacement rules.
- `architecture/RESTAURANT_SERVICE_ADAPTER_BOUNDARY.md` — current restaurant/place adapter boundary and external-system translation rules.
- `adoption/` — how Rifad evaluates and incorporates proven external logic.
- `donors/` — donor policy and evidence record template.
- `ui/UI_EXECUTION_MANIFEST.json` — binding screen/action/state/flow inventory and readiness status.
- `ui/UI_EXECUTION_MANIFEST_SCHEMA.md` — implementation gate and required evidence.
- `ui/DESIGN_AUTHORITY.md` — functional versus visual authority, touch-first/human-scale rule, responsive policy, restaurant-service rules and online-order interaction rules.
- `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` — **canonical POS terminology plus current/missing/reserved/derived/UI-only fields exposed by interface/product direction. Update this whenever new durable meaning is introduced.**
- `ui/UI_PROGRESS.md` — living record of implemented, owner-reviewed, pending and known-gap POS work.
- `ui/flows/` — bounded vertical slices authorized for implementation.
- `ui/visual-decisions/` — approved/current visual interaction decisions and explicitly pending owner-directed directions.
- `ui/` — UI-first product-surface plan, provisional tokens and first executable target.

## Data-model guardrail

Do not postpone UI/product field discovery until database design.

If the interface/product direction introduces a new field, option, fulfillment mode, payment/collection fact, sales channel, integration mapping, customer attribute, setting or status, update `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` in the same change and classify it as current, required gap, reserved integration, derived or UI-only.

This explicitly includes restaurant/delivery concepts such as fulfillment mode, restaurant-service configuration, optional place-group/place management, open-order lifecycle, sales channels, channel-specific pricing, external-order/payment-collection state, settlement/reconciliation and kitchen-dispatch evidence.

## Research

- `research/loyverse/` — preserved product, UI and technical reference research.
- `research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md` — current official-market comparison for direct sale, simple/advanced local service, open orders, kitchen routing, channels and pricing.
- `research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md` — current delivery-platform API evidence, Foodics/aggregator workflow comparison, and Rifad direct-vs-aggregator adapter direction.
- `research/historical-proposals/` — earlier Odoo/hybrid/open-source proposals retained for evidence. These proposals do not own current Rifad architecture.

Research remains evidence, not automatic implementation authority. Executable behavior still requires the relevant manifest/contract scope; public API documentation alone is not proof that Rifad has production partner credentials or certification.
