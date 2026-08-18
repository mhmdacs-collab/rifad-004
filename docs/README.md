# Rifad Documentation Map

Last updated: 2026-08-18

This directory separates binding Rifad decisions from historical/research evidence.

## New-session / Codex continuation entry point

When resuming the current work in a new ChatGPT/Codex session, read **`CURRENT_WORK_HANDOFF_2026-08-18.md` first** after `PROJECT_RULES.md`.

That handoff records the current branch/PR workflow, adapter/persistence foundations, POS and restaurant state, delivery/channel decisions, current Back Office catalog model, latest Loyverse-driven visual direction, explicit non-claims, and the recommended continuation order.

For the current Back Office/Loyverse evidence specifically, also read:

- `research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md` — official source list, owner-screenshot observations, product inferences and Rifad-vs-Loyverse boundaries.

## Authority order

When documents conflict, use this order:

1. `PROJECT_RULES.md` at the repository root.
2. `architecture/CURRENT_DECISIONS.md`.
3. `architecture/RIFAD_ARCHITECTURE.md`, current capability/adoption policy and UI authority policy.
4. `ui/UI_EXECUTION_MANIFEST.json` for implementation identity/readiness/scope.
5. `ui/DESIGN_AUTHORITY.md` for POS interaction/visual authority.
6. `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` for canonical labels and UI-to-data field traceability.
7. `ui/UI_PROGRESS.md` and current UI/product plans for living implementation status.
8. `CURRENT_WORK_HANDOFF_2026-08-18.md` for the latest continuation checkpoint when it does not conflict with higher authority.
9. Research and historical proposals as evidence only.

A product/visual discussion can be documented before implementation while still remaining explicitly **not manifest-authorized**. Restaurant local service has a bounded executable prototype under `POS-FLOW-002`; the first bounded Back Office catalog slice is `BO-FLOW-002`; online-order/delivery connector implementation remains pending separate scope.

## Current implementation documents

- `CURRENT_WORK_HANDOFF_2026-08-18.md` — **current cross-domain continuation checkpoint for new chats/Codex sessions.**
- `architecture/` — binding architecture direction and current decisions.
- `architecture/POS_RUNTIME_ADAPTER_BOUNDARY.md` — current general POS runtime composition/injection boundary and replacement rules.
- `architecture/RESTAURANT_SERVICE_ADAPTER_BOUNDARY.md` — current restaurant/place adapter boundary and external-system translation rules.
- `architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md` — local-first persistence identity, module-private snapshots, transactional outbox, retry/ack semantics, and the separation from LAN, branch/cloud sync and ZATCA/Fatoora.
- `architecture/BACK_OFFICE_CATALOG_BOUNDARY.md` — first Back Office catalog field-discovery boundary, shared Back Office/POS catalog meaning, bounded fields and explicit non-claim of LAN/cloud synchronization.
- `adoption/` — how Rifad evaluates and incorporates proven external logic.
- `donors/` — donor policy and evidence record template.
- `ui/UI_EXECUTION_MANIFEST.json` — binding screen/action/state/flow inventory and readiness status.
- `ui/UI_EXECUTION_MANIFEST_SCHEMA.md` — implementation gate and required evidence.
- `ui/DESIGN_AUTHORITY.md` — functional versus visual authority, touch-first/human-scale rule, responsive policy, restaurant-service rules and online-order interaction rules.
- `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` — **canonical terminology plus current/missing/reserved/derived/UI-only fields exposed by POS and Back Office product direction. Update this whenever new durable meaning is introduced.**
- `ui/UI_PROGRESS.md` — living record of implemented, owner-reviewed, pending and known-gap UI/product work.
- `ui/flows/` — bounded vertical slices authorized for implementation.
- `ui/visual-decisions/` — approved/current visual interaction decisions and explicitly pending owner-directed directions.
- `ui/` — UI-first product-surface plan, provisional tokens and first executable target.

## Data-model guardrail

Do not postpone UI/product field discovery until database design.

If the interface/product direction introduces a new field, option, fulfillment mode, payment/collection fact, sales channel, integration mapping, customer attribute, setting or status, update `ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` in the same change and classify it as current, required gap, reserved integration, derived or UI-only.

The current product priority is to continue completing relevant UI/product surfaces before freezing the production database. `BO-FLOW-002` therefore discovers product fields through the management UI while keeping transport/persistence replaceable.

This explicitly includes restaurant/delivery concepts such as fulfillment mode, restaurant-service configuration, optional place-group/place management, open-order lifecycle, sales channels, channel-specific pricing, external-order/payment-collection state, settlement/reconciliation and kitchen-dispatch evidence.

Invisible infrastructure facts such as installation identity, branch/device routing context, local snapshot schema versions, outbox event identity and delivery-attempt metadata are architecture/persistence concerns. They are documented in `architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md`; they should not be exposed as cashier fields merely because they are durable.

## Research

- `research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md` — **current Back Office reference snapshot:** official Loyverse pages reviewed, item/category/image/modifier/variant/store/inventory/composite/import-export findings, screenshot-derived visual lessons, and explicit Rifad-native deviations such as reusable option groups.
- `research/loyverse/` — preserved broader product, UI and technical reference research.
- `research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md` — current official-market comparison for direct sale, simple/advanced local service, open orders, kitchen routing, channels and pricing.
- `research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md` — current delivery-platform API evidence, Foodics/aggregator workflow comparison, and Rifad direct-vs-aggregator adapter direction.
- `research/historical-proposals/` — earlier Odoo/hybrid/open-source proposals retained for evidence. These proposals do not own current Rifad architecture.

Research remains evidence, not automatic implementation authority. Executable behavior still requires the relevant manifest/contract scope; public API documentation alone is not proof that Rifad has production partner credentials or certification.
