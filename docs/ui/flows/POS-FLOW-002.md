# POS-FLOW-002 — Restaurant Local Service Prototype

Last updated: 2026-08-20

## Status

Implemented mock/local UI slice on `agent/pos-visual-pass-01`; owner visual/product review remains iterative.

This executable subset proves the local-service interaction, open-place lifecycle and a replaceable Rifad-owned restaurant-service adapter boundary. It does **not** claim a real KDS, kitchen printer, multi-device table sync, or production restaurant persistence layer.

## Product rule

Restaurant service and place management are separate configuration layers:

1. **Restaurant service OFF** — retail/direct-sale mode. Do not force `محلي / سفري` wording into the cashier path. Touch and Basic use the retail ticket actions; Credit/settlement appears only when the effective POS configuration enables customer credit.
2. **Restaurant service ON + place management OFF** — simple restaurant. A non-empty Touch basket exposes **`محلي | سفري`**. `محلي` marks dine-in and enters payment selection in one touch; `سفري` marks takeaway and enters payment selection in one touch. There is no redundant intermediate **دفع** button.
3. **Restaurant service ON + place management ON** — advanced restaurant. A non-empty Touch basket still exposes **`محلي | سفري`**. `محلي` replaces the basket column with group/place selection and creates an open local order; `سفري` enters payment selection directly.
4. **Basic / البيع السريع** — restaurant interaction and restaurant staging settings are not part of the cashier path. The mode remains retail/search-first even if restaurant service is enabled for the Touch screen on the same device.

The current restaurant settings live in the POS only as UI-first staging configuration. Persistent business ownership is expected to move to Back Office later.

## Basket workspace rule

The cashier keeps the catalog visible and focused. Operational subtasks replace the **ticket/basket column**, not the whole sales screen.

Current basket-workspace tasks include:

- customer search/profile/attachment;
- Credit customer selection and confirmation;
- customer debt settlement;
- restaurant place selection and open-place recovery.

A task exposes one back-to-basket affordance. Successful task completion returns to the basket automatically when another confirmation is not operationally necessary. Creating a customer from the attach flow saves and attaches that customer without a second "add to ticket" step.

This is presentation/orchestration only: customer, credit, debt and restaurant mutations continue through their existing Rifad-owned contracts.

## Place grouping model

Cashier-facing structure is intentionally generic:

`مجموعة → أماكن`

Default prototype configuration is deliberately minimal:

- one group: **الطاولات**;
- six places: **طاولة 1** through **طاولة 6**;
- no default **الغرف** or **الجلسات** groups.

Future Back Office configuration may:

- add another place to an existing group;
- give a place any cashier-facing name, e.g. **طاولة 7**، **غرفة 1**، **جلسة 1**، **VIP 2**;
- add a new group such as **الغرف**، **الجلسات**، **الخارجية**، **VIP** or any owner-defined label;
- place any named places inside that group.

The Rifad domain does **not** require a hard-coded `table | room | session` type. The stable public terms are now `PlaceGroup` and `ServicePlace`. An external system may call the same concepts floor, zone, section, table, booth, room or seat; its adapter translates those names before they cross the Rifad contract.

## Advanced local flow

`build basket → محلي → basket-column place selection → choose group/place → mock kitchen revision 1 → clear working basket → طلبات مفتوحة`

Takeaway:

`build basket → سفري → payment methods`

Reopening:

`empty basket → طلبات مفتوحة · N → basket-column occupied-place view → reconstruct order → edit → إرسال or دفع`

- **إرسال** updates the stored open order, increments the mock kitchen revision and clears the working basket again.
- **دفع** on a reopened dine-in order uses the existing checkout flow. When payment succeeds, the matching open place is released.
- Cancelling checkout does not delete the stored local order.
- Customer-credit completion of a reopened local order participates in the same pending-settlement closeout signal as Cash/Card; the place must not remain occupied merely because the payment method was Credit.

## Visual rules

- Existing ticket header/footer geometry remains stable.
- With a non-empty normal restaurant Touch basket: **محلي | سفري**.
- There is no third **دفع** button between order classification and the payment-method page.
- Empty basket + advanced open local orders: **طلبات مفتوحة · N** is the single operational action.
- Reopened order: **إرسال | دفع**.
- Group tabs and place cards are large touch targets.
- Place cards show their configured name directly; they do not repeat a hard-coded kind label.
- cashier-facing place state is **متاحة / محجوزة**;
- a **محجوزة** place uses a very light warm-red treatment while the order total remains the strongest green value;
- item count is intentionally not shown;
- wide layouts use a readable place grid; mobile uses readable cards instead of shrinking a desktop floor plan;
- basket-workspace forms keep human-sized Arabic type and touch targets; constrained height scrolls content instead of shrinking important text.

## Replaceable adapter boundary

`RestaurantServiceContract` is the only restaurant/local boundary used by state orchestration. It is versioned as contract V1 and exposes Rifad-owned operations for:

- restaurant service configuration;
- `PlaceGroup → ServicePlace` listing;
- open local order listing;
- create/reopen/update/close open local orders.

Current concrete implementation is the mock adapter selected only from:

`apps/pos/src/runtime/restaurantServiceAdapter.ts`

Rules now enforced by code structure:

- `useLocalServiceFlow` receives `RestaurantServiceContract` by dependency injection;
- UI/state modules do not instantiate or import the concrete restaurant adapter;
- donor/API schemas and type names do not cross the contract;
- legacy mock-specific preference migration is isolated at the composition root;
- successful local-order payment is detected through Rifad POS state, not by reading the mock restaurant or POS storage implementation;
- old mock snapshots using the previous `serviceAreaId/serviceAreaName` fields are normalized to `placeGroupId/placeGroupName` on read.

A future Odoo, open-source donor, remote API, local embedded engine or Rifad-native implementation replaces the composition-root factory and must conform to the same contract.

See `docs/architecture/RESTAURANT_SERVICE_ADAPTER_BOUNDARY.md`.

## Explicit non-goals

- real kitchen printer or KDS transport;
- durable production `fulfillmentMode` on every sale/receipt;
- Back Office group/place CRUD in this POS flow;
- multi-device reserved-place synchronization;
- move, merge, split, seats or guest count;
- atomic production kitchen-delta/outbox semantics;
- delivery-platform integration;
- production fiscal cancellation behavior;
- claiming that every external restaurant system can be connected without a mapping adapter or conformance work.

## Acceptance evidence

Automated coverage must prove at minimum:

- simple restaurant presents **محلي | سفري**, not **محلي | دفع**;
- simple local reaches checkout without a place-selection step;
- Safari/takeaway reaches payment selection directly;
- advanced local starts with exactly one **الطاولات** group and six default tables;
- **الغرف** and **الجلسات** are not seeded by default;
- advanced local place selection is rendered inside the basket column while the catalog remains visible;
- advanced local selects an available place and clears the main basket;
- open-order action appears on an empty basket;
- a reserved place can be reopened from the basket column;
- sending additions increments the mock kitchen revision while keeping one open place;
- paying a reopened local order releases the place;
- retail/off mode hides restaurant language;
- Basic mode does not expose restaurant task actions or restaurant staging settings;
- open orders prevent disabling the settings that own them;
- TypeScript accepts the restaurant flow only through `RestaurantServiceContract` at the state boundary.

Final density and place-card geometry remain owner-review items.
