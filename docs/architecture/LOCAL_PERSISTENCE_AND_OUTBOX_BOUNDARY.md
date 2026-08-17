# Local Persistence and Transactional Outbox Boundary

Last updated: 2026-08-18

## Purpose

Rifad requires local-first POS operation without making LAN, cloud synchronization, accounting, or ZATCA/Fatoora the owner of a finalized local sale.

The architectural direction remains:

```text
Rifad UI / Core
      │
      ▼
Local persistent state
      │
      ├── finalized local business facts
      │
      └── transactional outbox
                │
       ┌────────┼───────────────┐
       ▼        ▼               ▼
      LAN    Cloud Sync    Fiscal / other adapters
```

These are separate capabilities. The local persistence boundary exists so they can consume durable Rifad facts without coupling POS business truth to any one transport or external platform.

## Current Rifad-owned contract

The POS now exposes `LocalPersistenceContract` V1 in:

`apps/pos/src/contracts/localPersistence.ts`

The contract provides:

- stable local installation identity;
- optional branch/device binding;
- module-private versioned snapshots;
- snapshot revision metadata;
- snapshot + outbox-event commit semantics;
- append-only pending domain events;
- stable event identity / deduplication;
- retry/failure bookkeeping;
- acknowledgement/removal after a downstream consumer confirms delivery.

Concrete selection is isolated in:

`apps/pos/src/runtime/localPersistenceAdapter.ts`

## Node identity and branch linking

A locally generated durable event carries:

- `installationId` — stable identity of the local Rifad installation/store;
- `branchId` — branch binding when the device is linked;
- `deviceId` — originating device when linked;
- stable event `id`;
- aggregate type/id;
- occurrence time;
- versioned event type;
- payload owned by Rifad.

This allows future branch/cloud synchronization to route and reconcile records without replacing Rifad local identity with a provider/donor identifier.

`installationId`, `branchId`, and `deviceId` have different meanings and must not be collapsed into one identifier.

## Transactional outbox rule

For business operations that must later leave the device, Rifad records a durable domain fact in the local outbox.

Stable event IDs are derived from stable command identity where applicable. Replaying the same durable command must not create duplicate sale/fiscal/sync work.

Current staging journal examples include:

- `sale.completed.v1`;
- `ticket.opened.v1`;
- `customer.created.v1`;
- `customer.updated.v1`;
- `customer.credit-charged.v1`;
- `customer.debt-settled.v1`;
- `local-order.opened.v1`;
- `local-order.updated.v1`;
- `local-order.closed.v1`;
- `print.attempted.v1`.

Event families may evolve before production contract freeze. Consumers must depend on versioned Rifad events, not on physical local-database tables.

## LAN is not cloud sync

LAN is a separate Rifad capability.

Potential branch-local consumers include:

- KDS;
- CDS;
- printers;
- other POS terminals / place occupancy coordination where authorized.

LAN transport must not obtain authority by directly reading another module's private persistence namespace. It receives commands/events/read models through a Rifad-owned LAN contract.

A working LAN must not be required merely to finalize an ordinary offline-capable local cash sale.

## Branch/cloud synchronization

Future Rifad Sync consumes pending durable facts and/or published module state through Rifad-owned sync contracts.

Target properties include:

- idempotent push/replay;
- explicit acknowledgement;
- retry/backoff;
- branch/device routing;
- pull/cursor semantics where needed;
- conflict policy per domain rather than one generic last-write-wins rule;
- migration/version evidence;
- no duplicate sale/payment creation after reconnect.

Cloud PostgreSQL is a target shared durable store, not a prerequisite for ordinary offline-capable sale completion.

## ZATCA / Fatoora boundary

ZATCA/Fatoora remains a first-class fiscal capability with its own Rifad adapter/state machine.

A finalized local sale must be durable before fiscal submission work starts, except where a future binding regulation explicitly requires a synchronous regulated action.

The fiscal adapter may consume an appropriate finalized-sale fact and maintain its own:

- fiscal document state;
- UUID/hash/sequence evidence as required;
- submission/reporting status;
- retries;
- acknowledgement/rejection evidence;
- audit trail.

A failed or unavailable fiscal transport must not cause Rifad to create a second sale. Fiscal retry reuses stable local identity/evidence.

The physical local persistence schema is not the Fatoora/ZATCA public contract.

## Accounting and other integrations

Accounting, ERP, delivery platforms, notifications and other external systems follow the same rule:

- they consume normalized Rifad contracts/events;
- they keep their external IDs/mapping/private credentials behind adapters;
- they do not become the owner of the finalized local POS sale by merely receiving or acknowledging it.

## Current staging implementation

Current composition selects:

`BrowserLocalPersistence`

with one browser-storage root under:

`rifad.local-persistence.v1`

This implementation deliberately keeps the contract asynchronous and transport-neutral so a future IndexedDB, OPFS, SQLite, embedded database, or other proven local store can replace it without changing POS/domain consumers.

The current browser-storage transport is **staging evidence only**. It is not claimed as the final high-volume, multi-process, crash-consistency, Windows production database.

For the current adapter, snapshot + queued events are written as one root value to demonstrate one local commit boundary. A production store must provide equivalent or stronger atomicity.

Corrupt persistence fails closed rather than silently resetting durable state.

## Current runtime journaling

The general POS runtime is decorated by:

`apps/pos/src/runtime/journaledPosRuntime.ts`

The restaurant-service runtime is decorated by:

`apps/pos/src/runtime/journaledRestaurantService.ts`

The decorators publish Rifad durable facts without forcing the current mock implementations to know about LAN/cloud/fiscal transports.

A completed cash/card/credit sale publishes a stable `sale.completed.v1` record carrying the completed receipt snapshot and local collection context. Replaying the same completion command produces one pending event identity rather than duplicate downstream sale work.

Open-local-order lifecycle events use the same local node identity so future branch-local coordination can be added behind separate adapters.

## Important current limitation

This change establishes the **persistence/outbox boundary**, not the final production local database migration.

The current POS mock still keeps its operational prototype snapshot in its legacy `rifad.pos.mock.v1` storage key, and the restaurant mock still keeps its current open-order/config staging snapshot in `rifad.pos.restaurant-service.v1`.

Therefore the next local-first implementation slice is:

1. move private POS operational snapshots behind `LocalPersistenceContract` namespaces;
2. move restaurant/open-order snapshots behind the same contract boundary;
3. define explicit snapshot schema versions/migrations;
4. prove cold restart restoration and migration behavior;
5. then select/prove the production storage engine appropriate for Windows/PWA requirements.

No LAN server, Branch Hub, cloud sync engine, or fiscal client is introduced merely to complete that migration.

## Module data ownership

Persistence namespaces remain private to their owning capability.

Examples of the target rule:

- Sales does not read Restaurant private state;
- LAN does not query Sales private tables;
- Fiscal does not mutate Sales private tables;
- Sync does not become the business-rules layer;
- external accounting does not own POS truth.

Cross-module behavior uses Rifad contracts, versioned domain events, or published read models.

## Acceptance before production storage freeze

Before the production local persistence implementation is accepted, evidence must cover at least:

- restart/cold-start restoration;
- schema migration forward compatibility;
- interrupted/crash write behavior;
- stable command/event identity;
- duplicate replay protection;
- storage corruption/error handling;
- offline completed sale survival;
- open local order survival;
- outbox retry and acknowledgement;
- branch/device identity preservation;
- storage capacity/performance under realistic transaction volume;
- Windows packaging behavior;
- browser/PWA behavior where supported.

LAN, cloud sync and ZATCA/Fatoora then receive their own separate proof matrices rather than being inferred from local persistence alone.
