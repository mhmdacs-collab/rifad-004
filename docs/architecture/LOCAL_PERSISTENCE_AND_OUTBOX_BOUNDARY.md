# Local Persistence and Transactional Outbox Boundary

Last updated: 2026-08-18

## Purpose

Rifad requires local-first POS operation without making LAN, cloud synchronization, accounting, or ZATCA/Fatoora the owner of a finalized local sale.

The architectural direction is:

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

The POS exposes `LocalPersistenceContract` V1 in:

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

## Current private snapshot namespaces

The current staging runtime now persists operational state behind two Rifad-owned namespaces:

- `pos.runtime`, schema version `1` — current POS device/employee/ticket/receipt history, sale pages, customers and credit/debt prototype state;
- `restaurant.service`, schema version `1` — current restaurant-service configuration and open local orders.

Namespace ownership is private. LAN, Sync, Fiscal, Accounting or another module must not read these physical snapshots as an integration API.

The authoritative integration surfaces remain Rifad contracts, versioned domain events and published read models.

## Legacy mock migration bridge

The current mock implementations were originally written directly against:

- `rifad.pos.mock.v1`;
- `rifad.pos.restaurant-service.v1`.

They are intentionally not being rewritten merely to prove persistence. Instead, the composition roots use a temporary adapter-only compatibility bridge:

`apps/pos/src/runtime/legacySnapshotBridge.ts`

Behavior:

1. if a Rifad namespace snapshot already exists, it is treated as the restart source and copied into the legacy mock key **before the mock is constructed**;
2. if no namespace exists but a legacy snapshot exists, that value is imported into `LocalPersistenceContract` as the initial schema-v1 snapshot;
3. after each durable mock mutation, the runtime decorator mirrors the resulting operational snapshot back through `LocalPersistenceContract`;
4. any domain events produced by that same action are committed with the snapshot in the same local persistence operation;
5. the legacy key remains a compatibility implementation detail until the mock store is retired.

This bridge must not become a permanent product dependency. A native persistence-aware POS/restaurant implementation should write through the Rifad persistence boundary directly and remove it.

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

## Current staging storage implementation

Current composition selects:

`BrowserLocalPersistence`

with one browser-storage root under:

`rifad.local-persistence.v1`

This implementation deliberately keeps the contract asynchronous and transport-neutral so a future IndexedDB, OPFS, SQLite, embedded database, or other proven local store can replace it without changing POS/domain consumers.

The current browser-storage transport is **staging evidence only**. It is not claimed as the final high-volume, multi-process, crash-consistency, Windows production database.

For the current adapter, snapshot + queued events are written as one root value to demonstrate one local commit boundary. A production store must provide equivalent or stronger atomicity.

Corrupt Rifad persistence fails closed rather than silently resetting durable state.

## Current runtime persistence decorators

The general POS runtime is decorated by:

`apps/pos/src/runtime/journaledPosRuntime.ts`

The restaurant-service runtime is decorated by:

`apps/pos/src/runtime/journaledRestaurantService.ts`

For the current legacy mocks, these decorators now do two jobs:

1. mirror durable operational snapshots through `LocalPersistenceContract` after state-changing operations;
2. commit cross-boundary Rifad domain events with the resulting snapshot when the action produces an event.

A completed cash/card/credit sale publishes a stable `sale.completed.v1` record carrying the completed receipt snapshot and local collection context.

Open-local-order lifecycle events use the same local node identity so future branch-local coordination can be added behind separate adapters.

## Cold restart evidence — current PASS for staging transport

`apps/pos/src/cold-restart-persistence.test.ts` proves the current browser staging path at runtime level rather than only testing storage helpers.

The proof intentionally removes the old compatibility keys before constructing fresh adapters.

Verified behavior:

- linked branch/device returns from the `pos.runtime` namespace;
- employee session returns;
- current working ticket and its line return;
- attached customer identity and persisted customer record return;
- the restored ticket can continue through checkout;
- completed receipt and receipt history return after another cold reconstruction;
- an advanced local order survives reconstruction from `restaurant.service`;
- its service place remains `طاولة 1` and the kitchen revision survives.

This proves **application reconstruction from Rifad namespace state in the current browser staging transport**.

It does not yet prove OS-process crash atomicity, disk durability guarantees, Windows installer behavior, database-lock behavior, multi-process writers or large-volume performance.

## What remains before production storage freeze

The next persistence work is no longer “move the mock snapshots behind the contract”; that bounded migration is now implemented and tested.

Remaining work is:

1. choose and prove the production local storage engine appropriate for Windows and supported PWA behavior;
2. define real forward schema-migration functions as schemas evolve beyond v1, including rollback/recovery policy;
3. prove interrupted/crash-write recovery, not only clean runtime reconstruction;
4. prove realistic transaction-volume/capacity/performance behavior;
5. remove the legacy mock bridge when a persistence-aware runtime replaces the current mocks;
6. prove offline start/restart in the packaged Windows application, not only JSDOM/runtime reconstruction.

No LAN server, Branch Hub, cloud sync engine, or fiscal client is introduced merely to complete local storage proof.

## Module data ownership

Persistence namespaces remain private to their owning capability.

Examples of the rule:

- Sales does not read Restaurant private state;
- LAN does not query Sales private tables;
- Fiscal does not mutate Sales private tables;
- Sync does not become the business-rules layer;
- external accounting does not own POS truth.

Cross-module behavior uses Rifad contracts, versioned domain events, or published read models.

## Acceptance before production storage freeze

Evidence must cover at least:

- restart/cold-start restoration — **staging runtime proof PASS; packaged Windows proof still pending**;
- schema migration forward compatibility — **v1 import/version guard exists; future-version migration proof pending**;
- interrupted/crash write behavior — pending;
- stable command/event identity — staging evidence present;
- duplicate replay protection — staging evidence present;
- storage corruption/error handling — staging evidence present;
- offline completed sale survival — staging reconstruction evidence present; packaged runtime proof pending;
- open local order survival — staging reconstruction evidence present;
- outbox retry and acknowledgement — staging evidence present;
- branch/device identity preservation — staging evidence present;
- storage capacity/performance under realistic transaction volume — pending;
- Windows packaging behavior — pending;
- browser/PWA behavior where supported — pending production-engine proof.

LAN, cloud sync and ZATCA/Fatoora receive their own separate proof matrices rather than being inferred from local persistence alone.
