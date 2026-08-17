# Restaurant POS Service, Open-Order and Channel Benchmark

Date: 2026-08-17
Status: Research evidence for current Rifad product discussion. This file is not implementation authorization.

## Question being answered

Rifad needs a restaurant workflow that is faster than a generic `Save ticket` pattern, works for direct takeaway sales, supports optional table/room/session service, routes kitchen work correctly, and can later support delivery platforms with channel-specific prices without confusing sales channel with payment method.

The research focus is therefore:

1. How do established POS products separate direct sales from table service?
2. How do they represent open orders/tables?
3. When are kitchen orders sent?
4. How do dine-in/takeaway/delivery concepts interact with payment and pricing?
5. Which parts should Rifad borrow as behavior, and which should it simplify?

## Official sources inspected

### Loyverse

- Open Tickets: https://help.loyverse.com/help/open-tickets
- Predefined Open Tickets / table naming: https://help.loyverse.com/help/how-use-predefined-open-tickets
- Dining Options: https://help.loyverse.com/help/dining-options
- Kitchen Printers: https://help.loyverse.com/help/using-kitchen-printers

Observed pattern:

- A normal sale can be saved as an open ticket and paid later.
- Predefined open-ticket names can represent tables.
- Dining options are a separate attribute such as Dine in / Takeout / Delivery and appear on kitchen/KDS output.
- With kitchen printers, saving an open ticket can print the kitchen order immediately.
- Later additions/removals to an open ticket produce corresponding kitchen changes.

Strength: very low training cost and a simple mental model.

Limit for Rifad: table service is primarily expressed as saved/predefined tickets rather than a rich operational place view. This is useful as a minimum baseline, but it is not the strongest model for restaurants with rooms, sessions, patios or many occupied places.

### Square for Restaurants

- Floor plans: https://squareup.com/help/us/en/article/6427-building-your-floor-plan
- Open tickets: https://squareup.com/help/us/en/article/5337-use-open-tickets-with-square
- Predefined tickets and groups: https://squareup.com/help/us/en/article/5809-use-predefined-tickets
- Dining options: https://squareup.com/help/au/en/article/5573-create-and-manage-dining-options
- Send & Stay: https://squareup.com/help/us/en/article/8612-set-up-send-stay-for-your-restaurant

Observed pattern:

- Floor plans contain sections and tables and are used operationally during service.
- Open checks/tickets are separate from immediate checkout.
- Ticket groups can represent areas such as dining room or patio.
- Dining option can be defaulted and carried to kitchen/reporting rather than repeatedly chosen from scratch.
- Kitchen sending can occur during order entry instead of waiting for final payment.

Strength: strong operational visibility and realistic table/service management.

Trade-off: a full-service workflow can create more UI and training overhead than a small cafe or direct-sale restaurant needs.

### Lightspeed Restaurant K-Series

- Floor plans and tables: https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804656709
- About floor plans: https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804656689
- POS configuration / direct sales vs table service: https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804606610
- Basic orders: https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050308894-Placing-basic-orders

Observed pattern:

- Table service is a distinct operating mode with floor plans.
- Direct sales are described separately as sales paid immediately without needing a table/tab.
- A POS configuration can disable table support for a device/workflow that only needs direct sales.
- Floor plans can carry order-profile and printer configuration.
- Areas and table identity are first-class operational concepts rather than free-text ticket names only.

Strength: this is close to the Rifad requirement that table service be optional while direct selling remains fast.

### Odoo 19 POS Restaurant

- Restaurant features: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/restaurant.html
- Presets: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/extra/presets.html
- Preparation display: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/extra/preparation.html

Observed pattern:

- The restaurant UI explicitly separates Tables, Register and Orders.
- A direct new order can exist without a table, or an order can later be assigned to a table/tab.
- `Send`/order preparation is separate from final payment.
- Presets can change configuration such as pricelist based on service type, including dine-in, takeout or delivery.
- Preparation output can identify table, order/preset and delivery/takeout context.

Strength: strong separation of order service state, kitchen preparation and payment.

Important lesson for Rifad: pricing/service context can be resolved before payment without making the service type itself a payment method.

### Toast

- Kitchen routing by dining option / service area: https://central.toasttab.com/articles/Knowledge/Print-Routing-by-Dining-Option

Observed pattern:

- Kitchen routing rules may depend on dining option and service area.
- Takeout/delivery can be routed differently from other orders.

Strength: confirms that dine-in/takeout/delivery is fundamentally useful to kitchen/operations routing, not only to customer-facing checkout.

---

# Rifad conclusion

Rifad should not copy a single donor. The recommended model is:

> **Fast direct sale by default + optional local-service/open-order layer + explicit sales-channel/pricing context.**

## 1. Kitchen fulfillment is not payment

Use a durable concept such as `fulfillmentMode`:

- `takeaway` — **سفري**; default for direct POS sale.
- `dine_in` — **محلي**; set when an order is assigned to a service place.
- `delivery` — **توصيل**; normally derived from a delivery sales channel/order workflow.

This is operational/kitchen information. It must not be modeled as `cash/card` and should not force a cashier-facing selector on every sale.

## 2. Sales channel is a separate dimension

Use a durable sales-channel identity, for example:

- direct POS;
- Keeta;
- HungerStation;
- Ninja;
- future marketplace/online channels.

The UI may present a platform as one convenient completion choice, but internally the system must still distinguish:

- sales channel;
- fulfillment mode;
- payment/settlement method.

This allows, for example, a delivery order to be cash-on-delivery, paid by card, or settled by the platform without corrupting reporting semantics.

## 3. Payment/settlement remains separate

Examples:

- cash;
- card / Mada;
- credit/customer account;
- platform settlement.

A channel may define a default settlement behavior, but channel identity must not be stored only as a payment method.

## 4. Channel-specific prices are required

Rifad should support:

- product base price;
- optional channel price list / product override;
- effective price resolution before final confirmation;
- separate platform commission/settlement terms.

Example intent:

- Latte base price;
- Keeta override 26;
- HungerStation override 25.

Do not encode this as `price when paymentMethod=keeta`. Resolve it from sales channel/pricing context.

If a platform is selected late in checkout and that selection changes prices, the changed total must be shown before the completion command is confirmed.

## 5. Table/local service is optional

A POS/branch setting controls whether table/local service is enabled.

When disabled:

- the cashier stays in direct-sale behavior;
- no table/local management step is forced into the sale.

When enabled:

- the current secondary `Save` concept evolves to **محلي** for a basket with items;
- pressing **محلي** opens service-area/place selection;
- selecting a place assigns the order, sends the required kitchen order, clears the main working basket and leaves an open order attached to that place;
- payment may occur before or after dining according to operation flow, not because `dine_in` inherently means pay later.

## 6. Service-area/place model

Do not hard-code every place as `table`.

Use:

- Service Area: e.g. الصالة، الدور الأول، الجلسات الخارجية، الغرف.
- Service Place: e.g. طاولة 12، غرفة 3، جلسة 8.

This supports restaurant layouts in Saudi/Gulf use cases more naturally than a table-only naming model.

## 7. Recommended POS presentation

Use a Rifad hybrid rather than a decorative clone:

- top/side area tabs for service areas;
- large service-place targets arranged approximately like the real layout on wide screens;
- every place shows a short name/number and operational state;
- occupied/open places can show elapsed time and amount when useful;
- mobile/narrow layouts may use a one-column/list/card representation instead of shrinking a floor plan;
- exact physical layout editing belongs primarily in Back Office later, while temporary configuration may remain in POS settings during UI-first development.

Avoid decorative chairs/furniture when they reduce touch size or scanning speed. The map should be semantically realistic, not architecturally photorealistic.

## 8. Open-order action behavior

Recommended cashier wording: **طلبات مفتوحة**, not `التذاكر المفتوحة`, because it describes the operational task rather than an internal ticket object.

Target action-card states when table service is enabled:

- basket has items: **محلي | دفع**, with **دفع** visually primary;
- basket empty + open local orders exist: **طلبات مفتوحة · N | دفع**, where **طلبات مفتوحة** becomes green/primary and disabled **دفع** becomes neutral/silver;
- basket empty + no open local orders: **محلي | دفع** with non-applicable actions appropriately disabled/neutral according to final visual design.

The card geometry must remain fixed even when visual priority changes.

## 9. Kitchen dispatch timing

Kitchen preparation must be an order operation, not blindly a payment side effect.

Intended product direction:

- direct takeaway: kitchen order is produced in the direct-sale completion flow;
- local: kitchen order is produced when the basket is assigned/sent to a service place, even if payment is much later;
- local additions: send/print only the new/changed preparation delta, not a misleading full duplicate order;
- delivery: kitchen output carries **توصيل** plus channel identity where useful.

Production implementation will need durable dispatch/revision/idempotency semantics before this is treated as complete printer/KDS behavior.

---

# What Rifad should borrow and what it should not

Borrow:

- Loyverse simplicity and low-friction direct sale;
- Square/Lightspeed service-area and open-place visibility;
- Lightspeed optional table-service configuration;
- Odoo separation of direct register, tables/orders and kitchen send vs payment;
- donor evidence that fulfillment context belongs on kitchen output.

Do not copy:

- Loyverse `Save` as the permanent restaurant-facing meaning when the real user intent is local service;
- a mandatory dine-in/takeout/delivery chooser on every sale;
- a visually heavy floor-plan editor inside the cashier's normal path;
- delivery-platform identity as only a payment method;
- platform commission hidden inside product price.

## Implementation boundary

This benchmark records product direction only.

Before code is authorized:

1. reconcile `UI_EXECUTION_MANIFEST.json` with a new bounded restaurant/open-order flow;
2. define Rifad contracts for service areas/places, open-order lifecycle, fulfillment, channels, pricing context and kitchen dispatch;
3. update mock/local persistence intentionally;
4. then implement the owner-approved visual flow.
