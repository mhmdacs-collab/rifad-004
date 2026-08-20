# POS Runtime Adapter Boundary

Last updated: 2026-08-18

## Purpose

Rifad POS must be able to replace catalog, sales, customer/credit, loyalty, checkout, receipts, printing and session implementations without rewriting cashier UI/state flows.

The rule is:

> **The POS flow depends on Rifad contracts. Concrete implementations are selected only at a composition root.**

This is the general POS equivalent of `RESTAURANT_SERVICE_ADAPTER_BOUNDARY.md`.

## Current composition point

Concrete POS runtime selection is isolated in:

`apps/pos/src/runtime/posRuntimeAdapter.ts`

Current selection:

`createPosRuntimeAdapter() → current POS runtime → local persistence journal decorator`

`App.tsx` creates the runtime once and injects it into:

`usePosFlow(posRuntime)`

`usePosFlow` no longer imports or constructs the mock runtime.

The local persistence/outbox implementation is selected separately through:

`apps/pos/src/runtime/localPersistenceAdapter.ts`

See `docs/architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md`.

## Public Rifad boundary

The runtime contract is `PosRuntimeContract`.

It composes the current Rifad-owned capability contracts:

- `DeviceSessionContract`
- `EmployeeSessionContract`
- `CatalogContract`
- `SaleLayoutContract`
- `SalesContract`
- `CustomerCreditContract`
- `LoyaltyContract`
- `CheckoutContract`
- `ReceiptsContract`
- `PrintingContract`

The older `MockPosRuntime` name remains only as a compatibility type alias for the current mock implementation. New product/runtime code must depend on `PosRuntimeContract`.

Local durable state/outbox has its own Rifad-owned `LocalPersistenceContract`; it is not part of any donor/provider runtime schema.

## Adapter implementation shapes

A future `PosRuntimeContract` may be assembled from:

1. **Rifad-native local modules** — local database/services owned by Rifad;
2. **remote API adapters** — one or more external backends translated into Rifad contracts;
3. **embedded permissive donor libraries** — isolated behind Rifad adapters;
4. **donor-derived Rifad implementations** — behavior/state machines ported or reimplemented after provenance/license review;
5. **hybrid composition** — for example Rifad-native sales + external accounting/printing/payment adapters.

No donor is required to implement the entire runtime. Individual capability adapters may be composed into one runtime.

## External-system translation rule

External SDK/schema/lifecycle details stop at the adapter boundary.

Examples:

- donor `product_variant` → Rifad `Product`;
- donor `order/check/ticket` → Rifad sale/order representation where behavior matches;
- provider payment session → Rifad checkout/payment contract result;
- external customer IDs remain mapping evidence and do not replace Rifad stable identity by default;
- donor-specific errors are translated to `PosContractError` or a future versioned Rifad error family;
- provider credentials/auth tokens never become cashier UI state.

## Local persistence/outbox relationship

The POS runtime does not call LAN, cloud sync, accounting or fiscal endpoints in order to finalize an ordinary offline-capable local sale.

Instead, durable cross-boundary facts are journaled through the Rifad local persistence/outbox boundary. Future LAN, cloud sync, branch coordination and ZATCA/Fatoora adapters consume appropriate Rifad events through their own contracts.

Current staging journals include a stable `sale.completed.v1` event for cash/card/credit completion. Stable event identity is derived from the durable command where applicable so replay does not create duplicate downstream sale/fiscal/sync work.

This does **not** yet mean the current mock operational snapshot has been migrated into the new persistence contract. That migration/restart proof is the next local-first slice.

## Current conformance evidence

`apps/pos/src/testing/posRuntimeConformance.ts` contains a reusable behavioral probe for any future `PosRuntimeContract` implementation.

The current probe verifies a minimal Rifad-owned sale path:

`catalog → start ticket → add item → checkout → select cash → complete → idempotent duplicate completion → receipt list`

Adapter-specific setup/authentication may be supplied before the common probe.

`apps/pos/src/pos-runtime-adapter.test.tsx` additionally proves that `usePosFlow` consumes an injected runtime by replacing catalog behavior with a test runtime and observing the injected data in React state.

This protects against accidentally reintroducing a hidden `createMockPosRuntime()` inside UI/state code.

Local persistence tests additionally cover installation identity, branch/device binding, snapshot+outbox commit semantics, event deduplication, retry bookkeeping, acknowledgement and corruption handling.

Runtime journaling tests verify sale and local-order events use the same branch/device node context.

## Replacement requirements

Before a production runtime/capability adapter is accepted:

1. UI/state code must still depend only on Rifad contracts;
2. the concrete implementation must be selected through a composition root;
3. donor/provider SDK types, IDs, persistence schemas and errors must remain private to the adapter;
4. relevant Rifad conformance tests must pass;
5. idempotency/retry/recovery behavior must be characterized for commands that can be repeated;
6. persistent mapping/migration/rollback must be defined where external IDs or state are stored;
7. security, license and provenance evidence must be recorded when applicable;
8. replacing the implementation must not require rewriting unrelated cashier surfaces.

## What this does not mean

“Adapter-ready” does not mean every production concern is solved.

Still separate work includes:

- migration of private operational POS/restaurant snapshots behind `LocalPersistenceContract`;
- production local-store selection and restart/migration/crash evidence;
- sync and conflict handling;
- branch-local LAN transport and multi-device coordination;
- production payments and terminal integration;
- ZATCA/Fatoora fiscal implementation;
- real printing/KDS transport;
- delivery-platform connectors;
- Back Office configuration and permissions;
- production observability, migrations and support matrices.

The boundary ensures these implementations can be selected and replaced without making them product architecture authorities.
