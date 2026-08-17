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
 Sales             Tables/Places            Inventory
 Orders            Fulfillment              Customers
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

Apps never bind directly to donor project internals.

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
- `core/tables` / service areas and places
- `core/kitchen` / preparation-order state
- `core/shifts`
- `core/inventory`
- `core/customers`
- `core/loyalty`
- `core/branches`
- `core/employees`
- `core/permissions`

Names may evolve before contract freeze; the separation of responsibilities is the important part.

### Adapters/integration domains

- `adapters/printing`
- `adapters/payments`
- `adapters/delivery-channels`
- `adapters/lan`
- `adapters/sync`
- `adapters/fiscal-zatca`
- `adapters/accounting`
- `adapters/notifications`
- `adapters/hardware`

## 3. Stable boundary rule

A UI action talks to a contract, not an implementation.

Example:

```text
POS "Move place/order" action
        │
        ▼
Tables/Places contract
        │
        ▼
Current local adapter
```

If the current adapter is replaced, the button and unrelated modules remain unchanged.

The same rule applies to concepts such as:

- checkout/completion;
- assign order to service place;
- send preparation delta;
- resolve effective channel price;
- select sales channel;
- close shift;
- print receipt;
- complete KDS item/order;
- inventory transfer;
- sync flush.

Exact method names are contract-design work and are not frozen by this architecture document.

## 4. Restaurant/order separation

Rifad does not collapse restaurant fulfillment, sales channel and payment into one field.

### Fulfillment

Operational/kitchen meaning:

- takeaway / **سفري**;
- dine-in / **محلي**;
- delivery / **توصيل**.

Direct POS sale may default to takeaway without asking the cashier to choose it every time.

### Sales channel

Commercial source of the order, for example:

- direct POS;
- Keeta;
- HungerStation;
- Ninja;
- future online/marketplace channel.

### Payment / settlement

How money is settled, for example cash, card/Mada, customer credit or platform settlement.

A fast UI may set several defaults from one tap, but durable domain facts remain separate so reporting, pricing, refunds and kitchen behavior are correct.

## 5. Local/table-service model

Table service is an optional capability, not a mandatory shape for every branch/device.

The domain should support:

- service areas such as dining room, floor, patio, rooms or sessions;
- service places such as a table, room or session;
- open orders attached to a place;
- moving/merging where later authorized;
- payment before or after preparation/dining;
- kitchen dispatch before final payment;
- later additions/voids as preparation deltas rather than blind full reprints.

Persistent editing of floor/place layout is expected to become Back Office responsibility. POS may temporarily host configuration during UI-first development but must not become the accidental long-term owner.

## 6. Pricing context

Product price authority must be able to resolve from a pricing context rather than only one scalar base price.

Target capabilities include:

- base product price;
- branch/pricelist rules when authorized;
- sales-channel price list or per-product channel override;
- effective-price snapshot on the ticket/receipt;
- separate platform commission/settlement terms.

Changing sales channel may change effective prices. The UI must show the resulting total before the final completion command.

## 7. Ownership

Each module owns its private state and schema. Another module may not query its private database tables directly.

Cross-module interaction is allowed through:

1. synchronous contracts for immediate commands/queries;
2. versioned domain events for state propagation;
3. read models explicitly published for shared presentation needs.

## 8. Offline and LAN

Offline and LAN are separate concerns.

- **Local persistence:** keeps POS operational without internet.
- **LAN:** lets branch devices such as KDS/CDS/printers communicate without cloud dependency where appropriate.
- **Cloud sync:** moves durable changes between branch/local state and Rifad cloud.

A loss of internet must not imply a loss of branch-local operation for workflows designed to work offline.

Restaurant implications include preserving open local orders and avoiding duplicate kitchen dispatch when connectivity changes.

## 9. Data direction

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

Exact storage libraries are implementation decisions. Contracts and product behavior must not depend on a specific donor schema.

## 10. Donor translation modes

A donor capability may enter Rifad in one of three ways:

### A. Direct permissive reuse
Use a small well-isolated library/module when license, API quality and maintenance profile are acceptable.

### B. Port/reimplementation
Extract state machine, invariants, algorithms and test vectors, then implement them in Rifad's stack.

### C. Behavioral reference only
For copyleft, proprietary, poorly isolated or fragile code, use documented/observable behavior as a specification and write a clean Rifad implementation.

## 11. Anti-Frankenstein rule

Puzzle architecture does **not** mean running ten unrelated applications together.

The final executable should present cohesive Rifad modules with Rifad contracts. Donor diversity belongs in provenance/research, not in the public shape of the product.

Composition happens at Rifad boundaries:

```text
Donor A proven slice ─┐
                      ├─> Rifad adapter/core implementation ─> Rifad contract
Donor B proven slice ─┘
```

It does not happen by modifying donor A until it contains donor B. That would leave donor A as the hidden architecture owner.

The mandatory capability workflow is documented in `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`.

## 12. Architecture decisions currently fixed

- Rifad owns its Core and contracts.
- UI first, with mock adapters until implementations arrive.
- React + TypeScript + Vite for the primary product UI.
- Windows desktop uses an application shell around the same product UI.
- Tablet/mobile uses an installable PWA with application-like behavior.
- Loyverse is the primary functional/workflow and ergonomic behavior reference; Rifad owns final visual authority.
- Restaurant fulfillment, sales channel and payment/settlement are distinct domain meanings.
- Optional local/table service uses service areas/places and open-order lifecycle rather than generic Save semantics alone.
- Pricing must be able to resolve channel-specific effective prices without treating channel as payment.
- Kitchen preparation state/dispatch is distinct from final payment timing.
- ZATCA is core.
- Accounting engines remain replaceable integrations.
- No Odoo/FloCafe/ERPNext schema is the Rifad public data contract.

All other technology choices remain subordinate to these constraints.
