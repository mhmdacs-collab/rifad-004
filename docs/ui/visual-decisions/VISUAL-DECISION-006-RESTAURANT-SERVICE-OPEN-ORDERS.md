# VISUAL-DECISION-006 — Restaurant Local Service and Open Orders

Status: **owner-directed product/interaction direction; market-researched; implementation and manifest authorization pending**

Date: 2026-08-17

## Evidence

Primary research summary:

- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`

Official products inspected include Loyverse, Square for Restaurants, Lightspeed Restaurant K-Series, Odoo 19 POS Restaurant and Toast kitchen routing.

## Product interpretation

Rifad treats **محلي / سفري / توصيل** primarily as kitchen/fulfillment context, not as a mandatory customer/cashier question and not as a payment method.

The normal cashier path should remain as short as possible.

## Direct sale

Direct POS selling defaults operationally to **سفري** unless another service context is explicitly created.

The cashier adds products and may go directly to **دفع**. Rifad should not add a separate `سفري` tap merely to restate the default.

## Table/local service enabled

When the table/local-service setting is enabled, the sale action currently labeled **حفظ** in the prototype is targeted to become **محلي**.

Target state with a non-empty working basket:

> **محلي | دفع**

- **دفع** stays the normal primary green action for an immediate direct sale.
- **محلي** is the route into service-place assignment, not a generic save command.
- pressing **محلي** must preserve the current basket while the cashier chooses the place.

After a place is selected:

1. the order is assigned to the selected service area/place;
2. the order becomes an open local order;
3. required kitchen output is sent/printed as **محلي** with place identity;
4. the main working basket clears for the next sale;
5. payment may happen later or immediately by reopening the order.

## Open local orders

Recommended cashier-facing term: **طلبات مفتوحة**.

When the working basket is empty and one or more local orders are open:

> **طلبات مفتوحة · N | دفع**

- the physical two-slot card does not move;
- **طلبات مفتوحة** occupies the same secondary/right slot previously used by **محلي**;
- **طلبات مفتوحة** becomes green/visually primary because resuming an existing order is the useful task;
- **دفع** remains in its usual left slot but is disabled/neutral because there is no payable working basket.

This is an intentional refinement of D-022: physical geometry remains stable, but visual priority may change when the active task changes and the normal completion action is unavailable.

## Table/local service disabled

The local/open-order control is not forced into a POS configuration that does not use table service.

The primary direct-sale path remains fast and the action card preserves its geometry. The final empty secondary-slot behavior will be decided with the implementation mock rather than inventing an unnecessary action.

## Service-area/place selector

Rifad should use a hybrid semantic floor view:

- service-area tabs such as **الصالة / الغرف / الجلسات الخارجية**;
- large touch targets for places such as **طاولة 12 / غرفة 3 / جلسة 8**;
- on wide screens, approximate the real physical arrangement enough for spatial memory;
- do not draw decorative furniture if that reduces touch/readability;
- on narrow/mobile screens, switch to a list/card composition instead of shrinking a desktop map;
- free/occupied/attention states must be recognizable by text/status plus color, not color alone;
- red remains reserved for destructive/error/urgent states and should not be the normal color of an occupied place.

Back Office should eventually own persistent place layout/editing. Temporary POS-side configuration is acceptable during UI-first discovery, but must be labeled staging configuration rather than final ownership.

## Fulfillment, sales channel and payment

The interface may combine some choices into one tap for speed, but the data model must keep three meanings separate:

1. fulfillment: **سفري / محلي / توصيل**;
2. sales channel: direct / Keeta / HungerStation / Ninja / future channels;
3. payment/settlement: cash / card / credit / platform settlement / future methods.

For a platform order, one tile/action may set a channel and its default settlement behavior together, but the resulting durable fields remain separate.

## Channel pricing

A sales channel may select a different product price list/override.

The UI must resolve and show the new effective total before final completion if selecting a channel changes prices.

Example concept:

- base Latte price;
- Keeta price 26;
- HungerStation price 25.

Platform commission/settlement fee is not the same fact as customer-facing product price and must remain separate.

## Kitchen behavior

Kitchen output follows the order/fulfillment lifecycle rather than one universal payment moment:

- direct sale: output as **سفري** in the direct completion path;
- local: output when the order is assigned/sent to its place;
- additions to an already-open local order: output only the new/voided delta with revision/idempotency evidence;
- platform delivery: output as **توصيل** and include channel identity when operationally useful.

## Relationship to current implementation

The current active branch still contains:

- a prototype **حفظ** action;
- a temporary local UI selector for **محلي / سفري / توصيل**;
- no durable open-table/service-place model;
- no sales-channel or channel-price model.

Those are not evidence that the target restaurant workflow is implemented.

Do not change `UI_EXECUTION_MANIFEST.json` or begin restaurant implementation from this decision alone. A bounded manifest/flow update is required first.
