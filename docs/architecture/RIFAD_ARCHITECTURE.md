# Rifad Architecture

Last updated: 2026-08-17

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
- `core/tables` / service areas and places
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

Examples:

```text
POS local-service action
        │
        ▼
Restaurant/Orders contract
        │
        ▼
Current local adapter
```

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

The same rule applies to checkout, assigning a service place, sending preparation deltas, resolving channel prices, incoming online orders, closing shifts, printing, KDS completion, inventory and sync.

Exact method names remain contract-design work.

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

`servicePlaceManagementEnabled` is an optional sub-capability.

When false:

`basket → محلي → checkout/complete as dine-in`

The kitchen receives **محلي**, but no table/room/session selection is required.

When true:

`basket → محلي → choose service area/place → send kitchen → clear working basket → keep open local order`

Service areas may be الصالة/الدور الأول/الغرف/الجلسات الخارجية. Service places may be a table, room or session.

Payment may happen before or after dining. Later additions/voids require preparation deltas rather than blind full reprints.

Persistent service/place layout configuration belongs primarily in Back Office; POS-side configuration is temporary staging during UI-first proof.

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

## 9. Offline and LAN

Offline and LAN are separate concerns.

- **Local persistence:** keeps POS operational without internet.
- **LAN:** supports branch-local KDS/CDS/printers where appropriate.
- **Cloud sync:** moves durable changes between branch/local state and Rifad cloud.

A loss of internet must not imply loss of branch-local operation for workflows designed to work offline.

Restaurant/delivery implications include preserving open local orders, preventing duplicate kitchen dispatch, and applying idempotent external webhook/retry handling.

## 10. Data direction

Initial target:

```text
Rifad UI
   │
Rifad Local/Core API
   │
Local persistent store
   │
Transactional outbox
   │
Rifad Sync
   │
Cloud PostgreSQL
```

Exact storage libraries are implementation decisions. Contracts/product behavior must not depend on donor schemas.

## 11. Donor translation modes

### A. Direct permissive reuse
Use a small isolated library/module when license/API/maintenance profile are acceptable.

### B. Port/reimplementation
Extract state machine, invariants, algorithms and test vectors, then implement them in Rifad's stack.

### C. Behavioral reference only
For proprietary/copyleft/poorly isolated code, use documented/observable behavior as specification and write a clean Rifad implementation.

## 12. Anti-Frankenstein rule

Puzzle architecture does **not** mean running unrelated applications together.

The final executable presents cohesive Rifad modules/contracts. Donor diversity belongs in provenance/research, not public product shape.

```text
Donor A proven slice ─┐
                      ├─> Rifad adapter/core implementation ─> Rifad contract
Donor B proven slice ─┘
```

The mandatory capability workflow is in `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`.

## 13. Architecture decisions currently fixed

- Rifad owns its Core/contracts.
- UI first, with mock adapters until implementations arrive.
- React + TypeScript + Vite for primary UI.
- Windows desktop wraps the same product UI; tablet/mobile uses installable PWA behavior.
- Loyverse is the primary functional/workflow/ergonomic baseline; Rifad owns final visual authority.
- Restaurant semantics and advanced place management are separate configuration layers.
- Fulfillment, channel and payment/collection/settlement are distinct domain meanings.
- Delivery integrations use a capability-based Rifad boundary and may be direct or aggregator-backed.
- Pricing supports channel-specific effective prices without treating channel as only payment.
- Kitchen preparation/dispatch is distinct from final payment timing.
- ZATCA is core.
- Accounting engines remain replaceable integrations.
- No Odoo/FloCafe/ERPNext/platform schema is the Rifad public data contract.

All other technology choices remain subordinate to these constraints.
