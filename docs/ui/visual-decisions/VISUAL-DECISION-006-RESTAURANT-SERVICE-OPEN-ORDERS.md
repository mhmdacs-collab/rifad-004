# VISUAL-DECISION-006 — Restaurant Service, Places and Online Orders

Status: **owner-directed product/interaction direction; market-researched; implementation and manifest authorization pending**

Date: 2026-08-17

## Evidence

Primary research summaries:

- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`
- `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`

Official products/platforms inspected include Loyverse, Square for Restaurants, Lightspeed Restaurant K-Series, Odoo 19 POS Restaurant, Toast kitchen routing, Foodics, HungerStation, Keeta, Jahez integration evidence, Deliverect, UrbanPiper and Grubtech.

## Product interpretation

Rifad does not force one restaurant model onto every business.

The UI must distinguish:

1. retail/direct sale with no restaurant-service terminology;
2. restaurant service that only needs **محلي / سفري** preparation identity;
3. advanced restaurant service that additionally needs service areas/places and open local orders;
4. delivery-platform orders, which may arrive automatically through integrations rather than being recreated by the cashier.

## Configuration hierarchy

### Restaurant service OFF

This is the clean direct-sale/retail mode.

- no permanent **محلي / سفري** choice is forced into the cashier flow;
- the normal transaction is simply **دفع**;
- suitable for retail, grocery and businesses that do not need restaurant kitchen fulfillment semantics.

### Restaurant service ON + place management OFF

This is the **simple restaurant** mode.

Target state with a non-empty basket:

> **محلي | دفع**

- pressing **دفع** follows the normal direct restaurant sale and is prepared as **سفري**;
- pressing **محلي** marks the order as local/dine-in and proceeds through checkout without asking for a table, room or session;
- the kitchen receives the correct **محلي** identity;
- no floor map/open-place workflow is imposed on a restaurant with only a few tables or no need to track exact seating.

### Restaurant service ON + place management ON

This is the **advanced restaurant** mode.

Target state with a non-empty basket:

> **محلي | دفع**

- **دفع** remains direct **سفري** sale;
- **محلي** opens service-area/place selection;
- selecting a place assigns and opens the order, sends the required kitchen output and clears the main working basket;
- payment may happen before or after dining by reopening the local order.

## Open local orders

Recommended cashier-facing term: **طلبات مفتوحة**.

Only advanced place-management mode requires this shortcut.

When the working basket is empty and one or more local orders are open:

> **طلبات مفتوحة · N | دفع**

- physical two-slot geometry does not move;
- **طلبات مفتوحة** occupies the same right slot previously used by **محلي**;
- it becomes green/visually primary because reopening work is the useful task;
- **دفع** remains in its usual left slot but is disabled/neutral because there is no payable working basket.

When a new basket receives items, the action returns to:

> **محلي | دفع**

with **دفع** again visually primary.

## Service-area/place selector

Rifad should use a hybrid semantic floor view:

- service-area tabs such as **الصالة / الدور الأول / الغرف / الجلسات الخارجية**;
- large touch targets for places such as **طاولة 12 / غرفة 3 / جلسة 8**;
- on wide screens, approximate the physical arrangement enough to aid spatial memory;
- do not draw decorative furniture if that reduces touch/readability;
- on narrow/mobile screens, switch to list/cards instead of shrinking a desktop map;
- free/occupied/attention states use text/status plus color, not color alone;
- red remains reserved for destructive/error/urgent states.

Back Office should eventually own persistent service configuration and place layout. Temporary POS-side settings are allowed only during UI-first product proof and should not become ordinary-cashier controls in production.

## Fulfillment, channel and payment/collection

The cashier experience may combine choices for speed, but Rifad keeps separate durable meanings:

1. fulfillment: **سفري / محلي / توصيل**;
2. sales channel: direct / Keeta / HungerStation / Jahez / Ninja / future channels;
3. payment/collection/settlement: cash, Mada/card, credit, prepaid by platform, due on delivery/pickup, later platform settlement.

A platform may appear as a convenient tile in a manual completion surface, but platform identity is not stored only as a payment method.

## Delivery platform UX — connected versus manual

### API-connected incoming order

The cashier should **not** manually select the platform again.

Preferred behavior:

`incoming platform order → online-orders queue → auto accept or one-tap accept → kitchen → ready/complete`

The order already carries:

- channel identity;
- external order number/code;
- delivery/pickup fulfillment;
- sold product/option prices;
- external payment/collection state where provided.

Examples of compact cashier labels:

- **كيتا · مدفوع**;
- **هنقرستيشن · نقد عند الاستلام**;
- **جاهز · مدفوع**.

If branch policy enables automatic acceptance and kitchen sending, no cashier touch is required before preparation.

### Manual/fallback delivery order

A visible **كيتا / هنقرستيشن / ...** choice remains useful when the channel is not connected or an authorized fallback is required.

The tile may feel like a payment/completion choice for cashier simplicity, but internally it sets channel + delivery fulfillment + channel pricing + collection state separately.

## Paid versus unpaid external orders

- prepaid external order: do **not** ask the cashier to choose cash/Mada again;
- cash/card on delivery/pickup: keep the order unpaid until money is actually collected;
- do not mark a promised future collection as a completed local payment;
- later platform settlement must not create a duplicate sale.

This follows the practical pattern observed in Foodics online-order/payment mapping.

## Channel pricing

### Manual platform sale

Selecting the platform applies Rifad's configured channel pricelist/overrides. If the total changes, show the recalculated total before final completion.

### API-connected external order

Preserve the actual external sold prices as order snapshots. Validate product mapping, but do not silently overwrite those prices with today's direct-POS base price.

Platform commission/settlement fee is separate from customer-facing selling price.

## Kitchen behavior

Kitchen output follows fulfillment/order lifecycle:

- direct restaurant **دفع**: **سفري**;
- simple **محلي**: local kitchen output without a required place;
- advanced **محلي**: output when the order is assigned/sent to a service place;
- later advanced-local additions/voids: send preparation deltas/revisions rather than blind full duplicates;
- delivery: **توصيل** plus channel identity where useful;
- API-connected delivery: may auto-send to kitchen after integration acceptance according to branch policy.

## One online-orders experience

Rifad should not create a separate cashier screen/workflow for Keeta, HungerStation, Jahez and every future platform.

Target principle:

> **One online-orders experience for the cashier, many direct or aggregator adapters behind it.**

The cashier sees platform identity on each order, while connection credentials, menu/channel-price mapping, branch mapping, automation policy and reconciliation configuration move to Back Office later.

## Relationship to current implementation

The current active branch still contains:

- prototype **حفظ**;
- temporary UI-local **محلي / سفري / توصيل** selector;
- no durable restaurant-service configuration;
- no simple-vs-place-managed local flow;
- no durable open-place model;
- no delivery-channel adapter or online-order queue;
- no channel-price model.

Those are not evidence that the target restaurant/delivery workflow is implemented.

Do not change `UI_EXECUTION_MANIFEST.json` or begin this implementation from this decision alone. A bounded manifest/contract update is required first.
