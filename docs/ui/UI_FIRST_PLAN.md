# Rifad UI-First Plan

Last updated: 2026-08-17

## Goal

Close the product-interface problem first without coupling the interface to unfinished backend implementations.

The UI phase builds primary Rifad surfaces using Rifad-owned contracts and mock adapters, while simultaneously discovering the durable data fields the production system will require.

## Live execution status

This file defines the plan. Actual implementation/review/gap status lives in [`UI_PROGRESS.md`](./UI_PROGRESS.md). Canonical cashier-facing names and UI-to-data traceability live in [`POS_UI_NAMING_AND_FIELD_REGISTER.md`](./POS_UI_NAMING_AND_FIELD_REGISTER.md).

Do not infer completion from this plan alone.

## Surfaces

1. POS
2. Back Office
3. Dashboard
4. KDS
5. Customer Display

Loyverse research remains the primary workflow baseline. Cross-market evidence may refine bounded patterns; current restaurant/delivery research is under `docs/research/restaurant-pos/`.

`UI_EXECUTION_MANIFEST.json` converts approved evidence into stable IDs and ready scopes.

## Technology baseline

- React
- TypeScript
- Vite
- PWA for tablet/mobile
- Windows desktop shell around the same UI

Technology serves the interaction model; it must not force a generic web-dashboard experience.

## UX acceptance rule

> If the installed POS feels like a website instead of a cashier application, it fails.

Binding priority:

> **Touch first, then human visual clarity, then beauty.**

Required qualities include application-like installed behavior, tablet/POS-first density, immediate states, human finger targets, layout changes before shrinking key controls, RTL/LTR, responsive phone/tablet/desktop composition, offline-loadable shell, Windows keyboard/mouse support without degrading touch, and glance-readable money/next actions.

## Authority model

- Loyverse = primary functional/workflow baseline.
- Rifad design system = visual/interaction authority.
- Other products may influence narrow patterns only through documented research/decision.
- Visual improvement may not silently change workflow/action meaning/contracts/permissions/offline/fiscal/payment/integration semantics.

See `DESIGN_AUTHORITY.md`.

## Manifest implementation gate

Screen-family lists below are discovery scope, not permission to invent screens. Coding requires a `ready` screen/flow in `UI_EXECUTION_MANIFEST.json` and may implement only its declared actions/states.

Branch-level experiments or owner-directed directions may exist for validation, but remain clearly labeled until manifest/product scope is reconciled. Current mock card UX and restaurant/delivery directions have different maturity levels.

## Contract-driven mocks

Every durable business action calls a Rifad contract from day one. Mock adapters prove UI behavior; later adapters replace them without rebuilding the workflow.

## UI-to-data discovery rule

When UI/product direction introduces durable meaning, update `POS_UI_NAMING_AND_FIELD_REGISTER.md` immediately. Do not wait until SQL design to discover fulfillment, restaurant settings, service places, sales channels, external-order IDs, channel pricing, payment references, barcode/SKU, settlement or kitchen-dispatch needs.

Presentation-only state should not be persisted without a real recovery/product requirement.

## Restaurant workflow discovery rule

Before implementation, model separately:

- `restaurantServiceEnabled` — whether restaurant fulfillment semantics are used at all;
- `servicePlaceManagementEnabled` — whether local orders require exact area/place tracking;
- fulfillment (`سفري / محلي / توصيل`);
- sales channel (direct/platform/etc.);
- payment/collection/settlement;
- service area/place and open-order lifecycle when advanced mode is on;
- kitchen dispatch/revisions;
- channel pricing/effective-price evidence.

This produces three legitimate cashier configurations from one product:

1. retail/direct: no restaurant terminology;
2. simple restaurant: **محلي | دفع**, with local checkout but no table selector;
3. advanced restaurant: **محلي | دفع**, where local opens area/place assignment and open orders.

Direct restaurant **دفع** defaults to **سفري** without another tap.

## Delivery integration discovery rule

Delivery platform UX should not require the cashier to understand connector architecture.

Rifad target:

> **One online-orders experience, many adapters behind it.**

Adapters may be:

- direct platform connectors when official partner access is practical;
- aggregator connectors when they provide better coverage/onboarding economics.

The Rifad contract is capability-based; not every connector must support menu sync, availability, accept/reject, ready/dispatch, refund and reconciliation equally.

API-connected orders should arrive with channel/reference/prices/payment-collection state and should not be retyped or have the platform selected again. Manual platform tiles remain a fallback/unconnected path.

## Phase 1 screen families

### POS

- employee/PIN entry
- sales workspace
- product/category navigation
- current ticket
- modifiers/variants
- customer selection
- discounts/taxes
- simple local-service checkout
- advanced service-area/place/open-order flows
- unified online-orders queue/manual delivery fallback
- payment/split-payment surfaces
- receipts/refunds
- shifts/cash movements
- item-management shortcuts
- device settings

### Back Office

- stores/branches
- POS devices
- items/categories/modifiers
- pricelists/channel price overrides
- restaurant-service enablement
- advanced service areas/places
- delivery connector authorization/store mapping
- online-order automation policy
- inventory/purchasing/transfers/counts
- customers/loyalty
- employees/roles/permissions
- reports
- taxes/payment types
- sales channels/integrations/settings

### Dashboard

- sales summary/comparison
- inventory alerts
- branch summary
- owner operational indicators
- fulfillment/channel/settlement analysis when implemented

### KDS

- incoming tickets
- station routing
- fulfillment/service-place/channel context
- item/order completion/recall
- elapsed time/status
- offline/LAN state

### CDS

- cart/ticket presentation
- totals/tax/discount
- customer-facing payment state
- receipt/contact flow where applicable
- disconnected/reconnect state

## Definition of UI phase complete

UI phase is complete only when primary screens have stable manifest IDs/verified states, principal flows run end to end with mocks, durable actions cross Rifad contracts, domain logic stays outside views, RTL/LTR works, touch targets remain human-usable across target sizes, PWA/Windows shell feel app-like, major states have regression evidence, adapters are replaceable without UI restructuring, adopted donor patterns are documented, and every visible durable field is registered/closed/deferred.

## Explicit non-goals of UI phase

- repairing donor apps;
- binding Rifad to Odoo/FloCafe/platform internals;
- premature final synchronization/cloud infrastructure;
- duplicate native UIs just for appearance;
- claiming real payment-terminal support from mock card UX;
- claiming delivery-platform production integration merely because public API documentation exists.

The UI phase produces a complete interactive Rifad shell **and** a concrete, traceable shopping list of backend/domain fields/contracts/integration capabilities.
