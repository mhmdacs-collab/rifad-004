# POS-FLOW-002 — Restaurant Local Service Prototype

Last updated: 2026-08-17

## Status

Implemented mock/local UI slice on `agent/pos-visual-pass-01`; owner visual/product review is still pending.

This is the first executable subset of the older mapped restaurant open-ticket flow. It proves the local-service interaction and open-place lifecycle only. It does **not** claim a real KDS, kitchen printer, multi-device table sync, or production restaurant persistence layer.

## Product rule

Restaurant service and place management are separate configuration layers:

1. **Restaurant service OFF** — retail/direct-sale mode. Do not force `محلي / سفري` wording into the cashier path.
2. **Restaurant service ON + place management OFF** — simple restaurant. Direct **دفع** is operationally takeaway; **محلي** enters the normal checkout in one touch without asking for a table.
3. **Restaurant service ON + place management ON** — advanced restaurant. **محلي** opens area/place selection and creates an open local order.

The current settings live in the POS only as UI-first staging configuration. Persistent business ownership is expected to move to Back Office later.

## Advanced local flow

`build basket → محلي → choose area/place → mock kitchen revision 1 → clear working basket → طلبات مفتوحة`

Reopening:

`empty basket → طلبات مفتوحة · N → occupied place → reconstruct order → edit → إرسال or دفع`

- **إرسال** updates the stored open order, increments the mock kitchen revision and clears the working basket again.
- **دفع** uses the existing checkout flow. When payment succeeds, the matching open place is released.
- Cancelling checkout does not delete the stored local order.

## Visual rules

- Existing ticket header/footer geometry remains stable.
- With a non-empty normal restaurant basket: **محلي | دفع**.
- Empty basket + open local orders: **طلبات مفتوحة · N | دفع**; Open Orders becomes green while disabled Pay remains in its fixed slot.
- Reopened order: **إرسال | دفع**.
- Area tabs and place cards are large touch targets.
- Occupied places use calm service-state styling, not destructive red.
- Wide layouts use a semantic spatial grid; mobile uses readable cards instead of shrinking a desktop floor plan.

## Mock adapter boundary

`RestaurantServiceContract` currently owns only the UI-proof state:

- restaurant service configuration;
- demo service areas/places;
- open local order snapshots;
- mock kitchen revision counter;
- close/release of an open place.

The existing Sales/Checkout contracts remain authoritative for the working basket and payment. Reopening reconstructs the stored order into the current mock ticket using existing sales actions.

This deliberate composition proves the interaction without pretending the final production order/table/KDS data model already exists.

## Explicit non-goals

- real kitchen printer or KDS transport;
- durable production `fulfillmentMode` on every sale/receipt;
- table/room layout editing in Back Office;
- multi-device occupied-place synchronization;
- move, merge, split, seats or guest count;
- atomic production kitchen-delta/outbox semantics;
- delivery-platform integration;
- production fiscal cancellation behavior.

## Acceptance evidence

Automated coverage must prove at minimum:

- simple local reaches checkout without a place-selection step;
- advanced local selects a free place and clears the main basket;
- open-order action appears on an empty basket;
- an occupied place can be reopened;
- sending additions increments the mock kitchen revision while keeping one open place;
- paying a reopened local order releases the place;
- retail/off mode hides restaurant language;
- open orders prevent disabling the settings that own them.

Final color, density, place-card geometry and overall visual quality remain owner-review items.
