# Restaurant Service Adapter Boundary

Last updated: 2026-08-17

## Purpose

Rifad must be able to replace the current restaurant/local implementation with an external API, embedded open-source engine, donor module, Odoo-backed service, aggregator, or Rifad-native implementation without rewriting the cashier UI.

The rule is:

> **External implementations adapt to Rifad. Rifad does not adapt its public product contract to the first external implementation selected.**

## Composition point

The current POS selects the concrete implementation only in:

`apps/pos/src/runtime/restaurantServiceAdapter.ts`

Current selection:

`createRestaurantServiceAdapter() → createMockRestaurantService()`

A production migration should replace the factory result, not modify the cashier components or `useLocalServiceFlow` to call an external SDK directly.

## Public Rifad contract

The current public boundary is `RestaurantServiceContract` V1.

Core Rifad concepts:

- `RestaurantServiceConfig`
- `PlaceGroup`
- `ServicePlace`
- `OpenLocalOrder`

Core operations:

- read/update restaurant service configuration;
- list place groups and places;
- list open local orders;
- create an open local order for a selected place;
- get/reopen an open local order;
- update/send an open local order;
- close/release an open local order.

The contract carries an `adapterInfo` descriptor with adapter identity, contract version and transport class for diagnostics/integration evidence.

## Translation examples

External systems may use different words and structures. The adapter translates them.

Examples:

- external `floor` / `zone` / `section` → Rifad `PlaceGroup`;
- external `table` / `room` / `booth` / `seat` → Rifad `ServicePlace`;
- external `table_session` / `check` / `ticket` → Rifad `OpenLocalOrder` where behavior matches;
- external order/status IDs remain adapter mapping evidence and do not replace Rifad stable IDs by default;
- external SDK errors are translated to Rifad contract errors before reaching UI/state code.

Rifad must not expose donor SDK types, ORM entities, database tables, error enums, lifecycle objects or authentication details through the public contract.

## Supported implementation shapes

The same Rifad contract may be backed by:

1. **Embedded/local adapter** — permissively licensed library or local service runs on the branch device/server.
2. **Remote API adapter** — Rifad talks to an external restaurant/table API.
3. **Donor-derived Rifad implementation** — behavior/state machine is ported or reimplemented in Rifad after license and conformance review.
4. **Rifad-native implementation** — local/cloud Rifad service owns persistence directly.

The cashier experience must remain the same unless product requirements deliberately change.

## Current isolation guarantees

As of this checkpoint:

- `useLocalServiceFlow` receives `RestaurantServiceContract` by dependency injection;
- components do not instantiate a restaurant adapter;
- the concrete mock adapter is selected at the POS composition root;
- product-domain place terminology is generic `PlaceGroup → ServicePlace`;
- old `ServiceArea` public naming has been removed from the restaurant contract/domain;
- payment completion no longer depends on reading mock restaurant/POS storage from the local-service flow;
- current mock snapshot migration preserves earlier `serviceAreaId/serviceAreaName` prototype data;
- current TypeScript, tests and build pass with this boundary.

## What an external adapter must prove

Before a production adapter is accepted it must provide evidence for the capabilities Rifad uses.

Minimum restaurant/local conformance:

- stable mapping of groups and places;
- stable mapping of an open local order;
- idempotent create/update/close commands or an adapter-side strategy that provides equivalent behavior;
- occupied/reserved-place conflict handling;
- restart/reconnect behavior;
- explicit error translation;
- no silent loss of an open local order;
- deterministic release after completed settlement;
- authorization/credential ownership outside cashier UI;
- source/license/provenance review when code is reused.

Additional production requirements when kitchen/multi-device behavior is added:

- kitchen dispatch identity and delta/revision mapping;
- outbox/retry/idempotency semantics;
- concurrent updates from multiple POS devices;
- stale-version/conflict policy;
- offline/LAN behavior;
- durable audit history.

## Capabilities deliberately not frozen into V1 yet

Do not expand the contract merely because a donor supports a feature.

The following remain product decisions and should receive their own requirements before becoming public contract operations:

- move an order between places;
- merge places/orders;
- split bill/order;
- seats/guest count;
- advance reservations;
- waiter assignment;
- service charges;
- floor-plan coordinates/shapes;
- table availability reservations not backed by an active POS order.

A donor capability can be used only after Rifad decides the product actually needs it.

## Adapter replacement rule

A future adapter is accepted only if:

1. cashier/product code still depends on Rifad contracts;
2. external-specific details stay inside the adapter;
3. existing contract/conformance tests continue to pass or are deliberately versioned;
4. migration/rollback is defined for any persistent mapping;
5. replacing that adapter does not require rewriting unrelated sales/payment/customer UI.

This is the practical application of D-001, D-005, D-011 and the Capability Adoption Workflow.
