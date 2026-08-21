# Front Office Regression Finalization Design

Status: owner-directed implementation; runtime visual acceptance pending
Date: 2026-08-21
Base: `agent/rifad-frontoffice-final-ui` at `4a30118f11b1072db71569cb73fd9aeae37e8309`

## Goal

Finish the existing Rifad POS Front Office without changing its catalog/transaction-rail layout. Correct the current functional regressions, make restaurant updates explicit kitchen deltas, complete debt collection receipt printing through the Rifad printing boundary, and consolidate the cashier visual language in `front-office.css`.

## Scope and authority

This work is bounded to the already executable mock/local Front Office flows: `POS-FLOW-001`, `POS-FLOW-002`, and the existing customer/debt/payment surfaces. It does not claim MAP-04 or MAP-05 production completion, real KDS transport, production payment records, ZATCA, synchronization, or a production database.

The implementation follows:

- `PROJECT_RULES.md`;
- D-021 through D-029 in `docs/architecture/CURRENT_DECISIONS.md`;
- `PAYMENT_AND_DELIVERY_COLLECTION_DECISION.md`;
- `POS-FLOW-001` and `POS-FLOW-002`;
- `VISUAL-DECISION-003`, `005`, `006`, and `009`;
- the owner-provided Front Office acceptance specification attached to the task.

## Root causes confirmed

1. `TicketWorkspaceEnhancer` mutates React-rendered buttons with a global `MutationObserver` and capture listener. Default restaurant configuration therefore rewrites unrelated retail test surfaces and makes action identity timing-dependent.
2. `TransactionOperationEnhancer` and `LocalServiceEnhancer` also create structural DOM slots after render. The component tree is not the authority for clear-cart, restaurant settings, context badges, or return actions.
3. `OpenLocalOrder` stores only the latest full ticket plus a revision number. Updating the order replaces that ticket, so there is no immutable sent history, explicit delta, or update-command idempotency.
4. Reopening an order reconstructs the whole sent ticket through ordinary `addItem`, which merges later quantities into the same sales line. The UI cannot distinguish sent quantity from pending quantity.
5. Debt collection stores a collection receipt event, but the ledger record does not retain the collection method and the receipt screen has no printing command.
6. Customer creation exists in several divergent forms. Credit selection keeps the complete search list visible after selection, and multiple backdrops close on outside click.
7. Busy state is mostly React state, not an atomic in-flight lock; two taps can enter authorization, send, settlement, or print before the next render.
8. Historical CSS layers still own key debt/payment/customer geometry. `front-office.css` does not yet provide the final stable action/footer and contrast rules.

## Architecture

### Kitchen delta domain

Extend the current mock/local restaurant domain with immutable kitchen dispatch batches:

```ts
type KitchenDeltaKind = "add" | "reduce" | "cancel";

type KitchenDeltaLine = Readonly<{
  id: string;
  productId: string;
  name: string;
  unitPrice: Money;
  quantity: number;
  kind: KitchenDeltaKind;
}>;

type KitchenDispatchBatch = Readonly<{
  id: string;
  commandId: string;
  revision: number;
  sentAt: string;
  lines: readonly KitchenDeltaLine[];
}>;
```

`OpenLocalOrder.ticket` remains the current outstanding order truth and therefore owns the table total. `kitchenBatches` preserves exactly what was sent at each revision. The initial open creates revision 1 with `add` lines. Later updates diff the last sent ticket against the proposed current ticket, append one batch, and update the outstanding ticket. A repeated command ID returns the existing result without a second revision.

Legacy snapshots are normalized by synthesizing one revision-1 batch from their stored ticket. No production KDS transport is claimed.

### Ticket presentation

When no table is active, `TicketPanel` renders ordinary editable ticket rows. When a table is active it renders:

- immutable sent batches/history;
- pending `add`, `reduce`, or `cancel` rows derived from the last sent ticket versus the working ticket;
- the current outstanding total from the working ticket.

Adding the same product after a send may still use the existing sales ticket internally, but the presentation/domain diff exposes only the new quantity as pending. Sent rows are read-only. Reducing/cancelling sent quantity uses an explicit correction action and produces a negative delta; it never rewrites the dispatch history.

### React-owned transaction workspace

`SalesScreen` becomes the structural owner of ticket actions, clear-cart placement, restaurant settings, table context, and task replacement. The enhancer components become controlled React content or are removed. There will be no global DOM observer or capture listener for business interaction.

The action state is deterministic:

- active table + pending delta: Send enabled, Pay disabled;
- active table + no pending delta: Send disabled, Pay enabled;
- after adding a new change: Send enabled again, Pay disabled;
- send keeps the same table/order and working ticket open;
- leaving is allowed only when there is no pending delta;
- dine-in payment never exposes Delivery.

### Customer flow inside Ticket Workspace

Do not open a separate dialog/modal when adding a customer to the current ticket. `TicketCustomerWorkspace` replaces the cart-column content with a light slide-up transition while the product catalog stays visible. It contains only name, mobile, optional tax number, and optional address. Cancel/back restores the cart without creating anything; there is no backdrop dismissal and no auto-save. Successful creation creates the customer, attaches it to the ticket, and returns to the cart automatically. Every ticket-attachment entry point reuses this component and flow.

Customer selection deliberately has two distinct interaction contracts:

- Attach customer to ticket: results stay visible and the selected result card exposes `إضافة إلى التذكرة` beside its customer data.
- Credit flow: after selection, search/results disappear and only the selected customer summary plus `تغيير العميل` remains.

### Debt collection and printing

Keep `DebtCollectionContract.settle` as the business command and persist `collectionMethod` on the ledger payment entry. Extend `PrintingContract` with an explicit debt-collection receipt submission method rather than fabricating a sales receipt.

The collection receipt shows receipt number, customer name/mobile, amount, method, date, time, cashier, branch, previous debt, paid amount, and remaining debt. The action footer contains `طباعة سند القبض` and `تم`. Settlement and printing use atomic in-flight locks.

### Visual consolidation

Only `front-office.css` receives new Front Office polish. It will own semantic tokens and final selectors for ticket states, payment cards, customer selection, debt layout, collection receipt, focus-visible, pressed/disabled states, no-selection behavior, and responsive overflow. No `visual-pass-*` file is added.

## Error and concurrency behavior

- Invalid/empty kitchen deltas are rejected by the adapter.
- Repeated kitchen update command IDs are idempotent.
- Zero, negative, and overpayment remain rejected at the contract boundary.
- Missing collection method blocks settlement.
- Atomic refs guard Pay, Send, Save/Create, Debt Settlement, and Print before React busy state updates.
- A failed command releases its lock and leaves the user on the same recoverable surface.

## Verification

Automated coverage will prove the 24 owner acceptance behaviors where the current mock/local contracts can represent them. Runtime review will cover 1366×768, 1440×900, 1920×1080, and 1024×768 landscape for the cart, payment, table/open orders, credit, add customer, debt, collection receipt, and settings surfaces. A viewport can be marked PASS only after the application is actually running and the rendered result is observed or captured at that size. If browser runtime is unavailable, record `UNVERIFIED` and do not mark the task done.

Completion reporting must distinguish current mock/local proof from production capability gaps.
