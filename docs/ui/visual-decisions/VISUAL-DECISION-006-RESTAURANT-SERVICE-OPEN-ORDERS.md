# VISUAL-DECISION-006 — Restaurant Service, Places and Online Orders

Status: **owner-directed product/interaction direction; market-researched; local-service mock subset implemented and iterating under owner visual review; online-order implementation still pending**

Date: 2026-08-17

## Evidence

Primary research summaries:

- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`
- `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`

Official products/platforms inspected include Loyverse, Square for Restaurants, Lightspeed Restaurant K-Series, Odoo 19 POS Restaurant, Toast kitchen routing, Foodics, HungerStation, Keeta, Jahez integration evidence, Deliverect, UrbanPiper and Grubtech.

## Product interpretation

Rifad does not force one restaurant model onto every business.

The UI distinguishes:

1. retail/direct sale with no restaurant-service terminology;
2. restaurant service that only needs **محلي / سفري** preparation identity;
3. advanced restaurant service that additionally needs configurable place groups/places and open local orders;
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
- pressing **محلي** proceeds through checkout without asking for a table or any other place;
- no open-place workflow is imposed on a restaurant that does not need exact seating.

### Restaurant service ON + place management ON

This is the **advanced restaurant** mode.

Target state with a non-empty basket:

> **محلي | دفع**

- **دفع** remains direct **سفري** sale;
- **محلي** opens group/place selection;
- selecting a place assigns and opens the order, records the current mock kitchen revision and clears the main working basket;
- payment may happen later by reopening the local order.

## Place-group model

The cashier-facing structure is:

> **مجموعة → أماكن**

The product must not hard-code restaurant venue vocabulary into the place record.

Current default advanced configuration is deliberately minimal:

- one group: **الطاولات**;
- six places: **طاولة 1** through **طاولة 6**;
- no default **الغرف** or **الجلسات** tabs.

Future Back Office configuration may add places to an existing group or create any new group. Examples:

- group **الغرف** containing **غرفة 1 / غرفة 2**;
- group **الجلسات** containing **جلسة 1 / جلسة 2**;
- group **الخارجية** or **VIP**;
- a place with any owner-defined cashier-facing name.

A place is therefore not required to carry a `table | room | session` enum. Its operational identity is stable ID + configured group + configured place name.

The current internal contract name `ServiceArea` represents this generic grouping layer; it does not imply that groups must correspond to physical floors or rooms.

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

When an occupied place is reopened, the first slot becomes:

> **إرسال | دفع**

**إرسال** means update the stored local order/preparation revision and return to a fresh working basket. It is not a real KDS/printer transport claim in the current prototype.

## Group/place selector

Rifad uses a simple semantic place view:

- large group tabs using configured names;
- large touch targets for configured places;
- place cards show the configured place name directly and do not repeat a hard-coded kind label;
- wide screens use a readable place grid;
- decorative furniture is intentionally avoided when it would reduce touch/readability;
- narrow/mobile layouts change to larger stacked cards;
- free/occupied states use text plus color, not color alone;
- occupied/open places may use a **very light warm-red surface and calm red status badge** to make occupancy immediately scannable without presenting the state as a destructive error;
- the open-order **total is the strongest value inside an occupied place card**, shown large and green; place name is next in hierarchy and elapsed time remains secondary;
- free places remain visually quiet and show a compact **اضغط لبدء طلب** hint;
- item count is intentionally **not** shown on place cards because it does not improve the cashier's place-selection decision;
- red remains strong/destructive only for actual destructive/error/urgent actions, while the occupied-card red is intentionally pale.

Back Office should eventually own persistent group/place configuration and optional layout. The current POS settings are staging controls for UI-first validation, not the intended ordinary-cashier production ownership model.

## Current executable local-service subset

`POS-FLOW-002` now authorizes a mock/local proof with:

- Restaurant service ON/OFF;
- place management ON/OFF;
- one-touch simple **محلي** checkout;
- advanced group/place selection;
- default **الطاولات** group with six places only;
- local open-order snapshots;
- **طلبات مفتوحة** state on an empty basket;
- reopening an occupied place into the working ticket;
- sending additions as a new mock kitchen revision;
- releasing the place after successful payment.

The implementation deliberately composes the existing Sales/Checkout contracts with a new `RestaurantServiceContract`. It does not alter the production sales schema merely to prove the visual flow.

Known boundary: fulfillment/place identity is not yet a durable authoritative field on the production-target Ticket/Receipt model. The mock local-service adapter preserves the UI proof separately. Production restaurant persistence, Back Office configuration, sync and kitchen dispatch remain required gaps.

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

The order already carries channel identity, external order code, fulfillment, sold prices and external payment/collection state where provided.

Examples:

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

## Channel pricing

For manual platform sale, selecting the platform applies configured channel pricing and any changed total is shown before completion.

For API-connected external orders, preserve actual external sold prices as order snapshots and validate product mapping rather than silently replacing them with today's direct-POS base price.

Platform commission/settlement fee remains separate from customer-facing selling price.

## Kitchen behavior

Target production behavior remains:

- direct restaurant **دفع**: **سفري**;
- simple **محلي**: local kitchen output without a required place;
- advanced **محلي**: output when assigned/sent to a configured place;
- later advanced-local additions/voids: preparation deltas/revisions rather than blind full duplicates;
- delivery: **توصيل** plus channel identity where useful;
- API-connected delivery may auto-send after integration acceptance according to branch policy.

The current executable local prototype proves only the local revision/state transition. It does **not** provide real kitchen transport.

## One online-orders experience

Rifad should not create a separate cashier workflow for every platform.

> **One online-orders experience for the cashier, many direct or aggregator adapters behind it.**

The online-orders implementation remains pending and is not authorized by `POS-FLOW-002`.
