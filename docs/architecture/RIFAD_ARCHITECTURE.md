# Rifad Architecture

## 1. Core principle

Rifad is assembled from replaceable capability modules behind stable Rifad-owned contracts.

```text
Apps
  POS / Back Office / Dashboard / KDS / CDS
                     │
                     ▼
              Rifad Contracts
                     │
   ┌─────────────────┼─────────────────┐
   │                 │                 │
 Sales             Tables           Inventory
 Money             Shifts           Customers
 Payments          Printing         Loyalty
 LAN               Sync             Fiscal
   │                 │                 │
   └─────────────────┼─────────────────┘
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
- `core/sales`
- `core/orders`
- `core/tables`
- `core/shifts`
- `core/inventory`
- `core/customers`
- `core/loyalty`
- `core/branches`
- `core/employees`
- `core/permissions`

### Adapters/integration domains

- `adapters/printing`
- `adapters/payments`
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
POS "Move table" button
        │
        ▼
TablesContract.moveOrder(...)
        │
        ▼
Current Tables Adapter
```

If the current adapter is replaced, the button and unrelated modules remain unchanged.

The same rule applies to:

- `SalesContract.checkout()`
- `ShiftContract.close()`
- `BranchContract.create()`
- `PrinterContract.printReceipt()`
- `KdsContract.completeTicket()`
- `InventoryContract.transfer()`
- `SyncContract.flush()`

Names above illustrate the boundary and may evolve before contract freeze.

## 4. Ownership

Each module owns its private state and schema. Another module may not query its private database tables directly.

Cross-module interaction is allowed through:

1. synchronous contracts for immediate commands/queries;
2. versioned domain events for state propagation;
3. read models explicitly published for shared presentation needs.

## 5. Offline and LAN

Offline and LAN are separate concerns.

- **Local persistence:** keeps POS operational without internet.
- **LAN:** lets branch devices such as KDS/CDS/printers communicate without cloud dependency where appropriate.
- **Cloud sync:** moves durable changes between branch/local state and Rifad cloud.

A loss of internet must not imply a loss of branch-local operation for workflows designed to work offline.

## 6. Data direction

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

## 7. Donor translation modes

A donor capability may enter Rifad in one of three ways:

### A. Direct permissive reuse
Use a small well-isolated library/module when license, API quality and maintenance profile are acceptable.

### B. Port/reimplementation
Extract state machine, invariants, algorithms and test vectors, then implement them in Rifad's stack.

### C. Behavioral reference only
For copyleft, proprietary, poorly isolated or fragile code, use documented/observable behavior as a specification and write a clean Rifad implementation.

## 8. Anti-Frankenstein rule

Puzzle architecture does **not** mean running ten unrelated applications together.

The final executable should present cohesive Rifad modules with Rifad contracts. Donor diversity belongs in provenance/research, not in the public shape of the product.

## 9. Architecture decisions currently fixed

- Rifad owns its Core and contracts.
- UI first, with mock adapters until implementations arrive.
- React + TypeScript + Vite for the primary product UI.
- Windows desktop uses an application shell around the same product UI.
- Tablet/mobile uses an installable PWA with application-like behavior.
- Loyverse is the primary UX/product behavior reference.
- ZATCA is core.
- Accounting engines remain replaceable integrations.
- No Odoo/FloCafe/ERPNext schema is the Rifad public data contract.

All other technology choices remain subordinate to these constraints.