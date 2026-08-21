# Rifad Approved Product Behavior Decisions

Status: **OWNER-APPROVED PRODUCT EVIDENCE**

This file preserves high-value product decisions discovered before the Core Lab. It describes desired Rifad behavior, not required implementation architecture.

## 1. Front Office / Back Office split

- Front Office is the fast cashier/branch execution surface.
- Back Office is the owner/management configuration and control surface.
- Do not clutter cashier UI with reports/admin/settings that belong to management.
- Owner-managed policy may be projected to POS; the cashier does not need an equivalent merchant-wide management screen.

## 2. Restaurant fulfillment

Initial restaurant sale context:

- `محلي` (dine-in/local service)
- `سفري` (takeaway)

Delivery is not a third basic restaurant type. Delivery operationally belongs to the takeaway/fulfillment side while **sales channel** and **payment/settlement** remain separate facts.

Keep separate meanings for:

1. fulfillment — dine-in/takeaway/delivery;
2. sales channel — direct POS/platform/future source;
3. payment/collection/settlement — cash/network/credit/platform prepaid/COD/etc.

## 3. Tables / local orders

When table/place management is disabled, Local behaves as an ordinary sale.

When tables are enabled:

- Local leads to area/table/place selection;
- the order is saved/reopenable;
- returning to sales does not require payment/close;
- the table/open order preserves total and kitchen history;
- successful settlement releases the occupied place.

The product must later support robust open-order lifecycle, multi-device/LAN coordination and conflict handling without losing these UX invariants.

## 4. Kitchen SENT / PENDING invariant

This is a critical product invariant discovered during Front Office work.

Before first Send:

- same item may aggregate normally.

After Send:

- sent lines/history are immutable cashier history;
- adding the same product again creates or joins a **new pending** quantity, never mutates the sent quantity;
- pending changes can be edited/cleared;
- clearing pending changes does not erase sent history;
- sending pending changes creates a new kitchen batch/revision;
- reopening the table/order preserves sent and pending truth;
- retry of the same durable send must not duplicate kitchen work.

Current cashier UX exposes **no ordinary edit/delete/cancel of sent lines**.

A future sent-item correction/void workflow requires an explicit product decision covering authorization, reason, audit, kitchen notification and financial consequences. Do not invent it as ordinary cart deletion.

## 5. Payment gating with kitchen changes

For an active table/local order:

- when unsent pending changes exist, `Pay` is blocked and `Send` is the primary action;
- when no pending changes remain after Send, `Pay` is enabled and Send is inactive until new changes exist.

## 6. Customer add workflow

`Add New Customer` is **not a modal**.

It replaces the Ticket Workspace/cart content inline while keeping the product catalog visible.

Fields:

- name — required;
- mobile — required;
- tax number — optional;
- address — optional.

Rules:

- no autosave;
- Cancel/Back returns without creation;
- explicit success creates the customer, attaches it to the ticket and returns to cart.

Normal ticket customer selection and Credit customer selection remain distinct UX flows.

## 7. Customer credit / debt

- Use an unambiguous debt meaning such as `الدين / عليه`, not an ambiguous generic balance label.
- Credit sale requires a customer.
- Debt settlement may use Cash or Network/Card collection rails.
- Zero/negative payment is invalid.
- Overpayment beyond debt is blocked.
- Partial settlement is allowed.
- Settlement reduces aggregate debt; it does not require allocating repayment to a specific historical invoice in the current product decision.
- Settlement creates a dedicated **collection receipt / سند قبض**, not a new sales tax invoice.
- Keep before / paid / remaining exact amounts and cashier/time/method evidence.

## 8. Payment Types

Starter payment meanings:

- Cash → direct impact `cash`;
- Network/Mada → direct impact `bank`;
- Credit/آجل → direct impact `customer-receivable`.

Payment selection should be configuration-driven, not permanently hard-coded to two buttons.

Unsupported configured payment lifecycles must not silently complete as Cash or Network.

Future split payment should allocate across enabled payment methods, not assume a fixed Cash/Network pair.

## 9. Delivery channel vs payment

Delivery/source channel and merchant collection are separate facts.

Example:

- channel = HungerStation;
- mode = COD;
- merchant collection = cash.

Current safe COD concept:

`Delivery → Channel → Pay on delivery → How did the store receive the money? → Cash | Network`

Platform prepaid/settlement is a different lifecycle and must not be disguised as local Cash/Network.

Future platform settlement needs its own receivable/commission/fee/adjustment/reconciliation truth.

## 10. Receipt printing behavior

Front Office preference includes an `Always Print` behavior:

- OFF: sale success may offer Print / New Sale / Always Print;
- ON: print automatically, then continue to the next sale flow.

Physical printer delivery and supported device/media behavior remain engineering capabilities to prove separately.

## 11. Printing targets

Rifad product/device horizon includes:

- 58 mm receipt printers;
- 80 mm receipt/kitchen printers;
- A4 printing;
- kitchen printers/screens where required.

Core selection should not be rejected merely because its native UI does not expose these if the engine has a clean graft/integration path.

## 12. Local-first operational goal

Ordinary offline-capable branch work must not depend on live cloud availability.

The product horizon includes local multi-device/branch coordination where required, especially for restaurant tables/orders/KDS/printers.

Core simulation must ask how restart, crash, duplicate prevention, LAN coordination and later cloud synchronization would work.

## 13. UI character

- Arabic-first / RTL support is required.
- The cashier experience should feel like an application, not a generic website.
- Loyverse is the functional/workflow/ergonomic baseline; Rifad keeps its own visual identity.
- Product images are optional; text-only large catalogs must still feel polished.

## 14. Implementation warning

These decisions are **product behavior evidence only**.

Do not infer that the old `rifad-004` Ticket, RestaurantServiceContract, BrowserLocalPersistence, React state shapes or adapter structure are required implementation models for the selected Primary Core.
