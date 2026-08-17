# Rifad Architecture

Last updated: 2026-08-18

## 1. Core principle

Rifad is assembled from replaceable capability modules behind stable Rifad-owned contracts.

```text
Apps
  POS / Back Office / Dashboard / KDS / CDS
                     │
                     ▼
              Rifad Contracts
                     │
   ┌─────────────────┼─────────────────────────┐
   │                 │                         │
 Sales             Service/Places            Inventory
 Orders            Fulfillment               Customers
 Money             Sales Channels           Loyalty
 Pricing           Kitchen/Preparation      Shifts
 Payments          Printing                 Fiscal
 LAN               Sync                     Permissions
   │                 │                         │
   └─────────────────┼─────────────────────────┘
                     ▼
              Rifad Data Layer
          Local DB ↔ Sync ↔ Cloud DB
```

Apps never bind directly to donor/platform internals.

## 2. Target module families

### Product apps

- `apps/pos`
- `apps/backoffice`
- `apps/dashboard`
- `apps/kds`
- `apps/cds`

### Core domains

- `core/catalog`
- `core/money`
- `core/pricing`
- `core/sales`
- `core/orders`
- `core/fulfillment`
- `core/sales-channels`
- `core/restaurant-service`
- `core/places` / place groups and service places
- `core/kitchen` / preparation-order state
- `core/shifts`
- `core/inventory`
- `core/customers`
- `core/loyalty`
- `core/branches`
- `core/employees`
- `core/permissions`

Names may evolve before contract freeze; separation of responsibilities is the important part.

### Adapters/integration domains

- `adapters/printing`
- `adapters/payments`
- `adapters/delivery-channels`
- `adapters/delivery-aggregators`
- `adapters/lan`
- `adapters/sync`
- `adapters/fiscal-zatca`
- `adapters/accounting`
- `adapters/notifications`
- `adapters/hardware`

## 3. Stable boundary rule

A UI action talks to a Rifad contract, not an implementation.

Current executable POS composition follows this rule:

```text
App.tsx
  │
  ├─ createPosRuntimeAdapter()
  │      │
  │      ▼
  │   PosRuntimeContract
  │      │
  │      └─ current: mock POS behavior + local persistence journal
  │
  └─ createRestaurantServiceAdapter()
         │
         ▼
      RestaurantServiceContract
         │
         └─ current: mock restaurant service + local persistence journal

Local persistence composition
  │
  └─ createLocalPersistenceAdapter()
         │
         ▼
      LocalPersistenceContract
         │
         └─ current staging transport: browser storage
```

`usePosFlow` and `useLocalServiceFlow` receive their business contracts by dependency injection and do not instantiate concrete adapters.

Future examples:

```text
Incoming Keeta/HungerStation order
        │
        ▼
DeliveryChannelContract
        │
   ┌────┴─────────────┐
   ▼                  ▼
Direct adapter   Aggregator adapter
```

If an adapter changes, the cashier flow and unrelated modules remain unchanged.

The same rule applies to checkout, assigning a service place, sending preparation deltas, resolving channel prices, incoming online orders, closing shifts, printing, KDS completion, inventory, local persistence, LAN, sync and fiscal work.

Current boundary details:

- `docs/architecture/POS_RUNTIME_ADAPTER_BOUNDARY.md`
- `docs/architecture/RESTAURANT_SERVICE_ADAPTER_BOUNDARY.md`
- `docs/architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md`

Exact future method names remain contract-design work.

## 4. Restaurant/order meaning separation

Rifad does not collapse fulfillment, sales channel and payment/collection into one field.

### Fulfillment

Operational/kitchen meaning:

- takeaway / **سفري**;
- dine-in / **محلي**;
- delivery / **توصيل**.

### Sales channel

Commercial/order source, for example:

- direct POS;
- Keeta;
- HungerStation;
- Jahez;
- Ninja;
- future online/marketplace channel.

### Payment / collection / settlement

How money is or will be collected/settled, for example:

- cash collected locally;
- Mada/card collected locally;
- customer credit;
- prepaid by platform;
- cash/card due on delivery/pickup;
- later platform settlement.

A fast cashier UI may combine defaults into one touch, but durable facts remain separate for pricing, kitchen routing, accounting, reconciliation and refunds.

## 5. Restaurant service has two configuration layers

Restaurant semantics are optional and must not leak into retail/direct POS.

### Layer A — restaurant service semantics

When `restaurantServiceEnabled` is false:

- POS is direct/retail selling;
- no permanent **محلي / سفري** question is forced;
- **دفع** is simply checkout.

When enabled:

- direct **دفع** defaults operationally to **سفري** without an extra cashier tap;
- **محلي** becomes the alternate dine-in/local path;
- delivery-channel orders establish **توصيل** through their own workflow.

### Layer B — service-place management

`placeManagementEnabled` is an optional sub-capability.

When false:

`basket → محلي → checkout/complete as dine-in`

The kitchen receives **محلي**, but no exact place selection is required.

When true:

`basket → محلي → choose PlaceGroup/ServicePlace → send kitchen → clear working basket → keep open local order`

The cashier-facing structure is generic **مجموعة → أماكن**. The prototype defaults to one **الطاولات** group containing six tables. Back Office may later add arbitrary groups such as الغرف / الجلسات / الخارجية / VIP and arbitrary place names within them.

Payment may happen before or after dining. Later additions/voids require preparation deltas rather than blind full reprints.

Persistent group/place configuration belongs primarily in Back Office; POS-side configuration is temporary staging during UI-first proof.

## 6. Pricing context

Product price authority must resolve from a pricing context rather than one scalar base price.

Target capabilities:

- base product price;
- branch/pricelist rules where authorized;
- channel price list or product override;
- effective-price snapshot on ticket/receipt/external order;
- separate platform commission/settlement terms.

For manual platform entry, changing channel may change effective prices and the POS must show the resulting total before completion.

For API-connected external orders, preserve the prices actually sold by the platform and validate/map product identity; do not silently rewrite the order using today's direct-POS base price.

## 7. Delivery-channel adapter model

Rifad supports two implementation modes behind one capability-based contract:

1. **Direct platform adapter** when official partner access is practical.
2. **Aggregator adapter** when a multi-platform provider offers better coverage/onboarding economics.

Potential adapter capabilities include:

- merchant authorization;
- branch/store mapping;
- menu/pricelist synchronization;
- item availability synchronization;
- incoming order webhook/polling;
- accept/reject;
- prepare/ready/dispatch/delivered status;
- cancel/refund;
- payment/collection details;
- settlement/reconciliation details.

Not every provider supports every capability. Rifad must query declared capabilities rather than scatter platform-specific conditionals across UI/domain code.

An API-connected order normalizes into Rifad-owned order concepts while preserving external IDs/event/idempotency evidence. The cashier should not reselect the platform or retype the order.

Preferred operating principle:

> **One online-order cashier experience, many adapters behind it.**

If branch policy allows, connected orders may be auto-accepted and sent to kitchen. Prepaid external orders do not trigger a second till/card collection; due-on-delivery/pickup orders remain unpaid until actual collection.

## 8. Ownership

Each module owns its private state/schema. Another module may not query its private tables directly.

Cross-module interaction is allowed through:

1. synchronous contracts for immediate commands/queries;
2. versioned domain events for state propagation;
3. published read models for shared presentation needs.

The local persistence layer stores private module state but does not make those private namespaces a shared integration API.

## 9. Offline and LAN

Offline and LAN are separate concerns.

- **Local persistence:** keeps POS operational without internet.
- **LAN:** supports branch-local KDS/CDS/printers and multi-device coordination where appropriate.
- **Cloud sync:** moves durable changes between branch/local state and Rifad cloud.

A loss of internet must not imply loss of branch-local operation for workflows designed to work offline.

Restaurant/delivery implications include preserving open local orders, preventing duplicate kitchen dispatch, and applying idempotent external webhook/retry handling.

LAN does not gain authority by reading private Sales/Restaurant persistence tables. It consumes Rifad contracts/events/read models through a separate LAN adapter boundary.

## 10. Data direction and executable persistence foundation

Target direction:

```text
Rifad UI
   │
Rifad Local/Core API
   │
Local persistent store
   │
Transactional outbox
   │
Rifad Sync / LAN / Fiscal consumers through separate contracts
   │
Cloud PostgreSQL / external endpoints as applicable
```

The first executable foundation now exists as `LocalPersistenceContract` V1 plus a replaceable `localPersistenceAdapter` composition point.

Current staging evidence provides:

- stable local installation identity;
- branch/device binding;
- module-private versioned snapshot contract;
- local snapshot + outbox commit semantics;
- stable outbox event identity/deduplication;
- retry/failure metadata and acknowledgement;
- sale/open-local-order journaling carrying branch/device context.

Current browser storage is staging only. Exact production storage remains proof-driven and replaceable; candidates may include IndexedDB/OPFS for supported browser/PWA environments or SQLite/another local database for the Windows host.

Important limitation: current mock operational POS and restaurant snapshots have not yet been migrated from their legacy localStorage keys into `LocalPersistenceContract`. That migration, schema-versioning and cold-restart evidence are the next local-first slice.

## 11. Fiscal / Fatoora principle

ZATCA/Fatoora is a first-class fiscal domain, not a side effect embedded in Sales persistence.

An offline-capable finalized sale is first made durable as a Rifad sale fact. A fiscal adapter then manages the applicable Saudi fiscal lifecycle, including identifiers/evidence, retries, acknowledgement/rejection and audit status.

Fiscal submission/retry must never create a second sale. The fiscal adapter consumes stable Rifad identity and must not own or mutate Sales private storage directly.

Exact online/offline reporting requirements remain subject to the applicable ZATCA phase/rules and dedicated fiscal proof; they are not inferred merely from local persistence.

## 12. Donor translation modes

### A. Direct permissive reuse
Use a small isolated library/module when license/API/maintenance profile are acceptable.

### B. Port/reimplementation
Extract state machine, invariants, algorithms and test vectors, then implement them in Rifad's stack.

### C. Behavioral reference only
For proprietary/copyleft/poorly isolated code, use documented/observable behavior as specification and write a clean Rifad implementation.

## 13. Anti-Frankenstein rule

Puzzle architecture does **not** mean running unrelated applications together.

The final executable presents cohesive Rifad modules/contracts. Donor diversity belongs in provenance/research, not public product shape.

```text
Donor A proven slice ─┐
                      ├─> Rifad adapter/core implementation ─> Rifad contract
Donor B proven slice ─┘
```

The mandatory capability workflow is in `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`.

## 14. Architecture decisions currently fixed

- Rifad owns its Core/contracts.
- UI first, with mock adapters until implementations arrive.
- React + TypeScript + Vite for primary UI.
- Windows desktop wraps the same product UI; tablet/mobile uses installable PWA behavior.
- Loyverse is the primary functional/workflow/ergonomic baseline; Rifad owns final visual authority.
- General POS runtime selection is isolated behind `PosRuntimeContract` and a composition root.
- Restaurant local-service selection is isolated behind `RestaurantServiceContract` and a composition root.
- Local persistence/outbox selection is isolated behind `LocalPersistenceContract` and a composition root.
- Restaurant semantics and advanced place management are separate configuration layers.
- Fulfillment, channel and payment/collection/settlement are distinct domain meanings.
- Delivery integrations use a capability-based Rifad boundary and may be direct or aggregator-backed.
- Pricing supports channel-specific effective prices without treating channel as only payment.
- Kitchen preparation/dispatch is distinct from final payment timing.
- Local persistence, LAN, cloud sync and fiscal submission are distinct capabilities.
- Stable local installation/branch/device identity must support later branch linking and replay-safe synchronization.
- ZATCA is core.
- Accounting engines remain replaceable integrations.
- No Odoo/FloCafe/ERPNext/platform schema is the Rifad public data contract.

All other technology choices remain subordinate to these constraints.
