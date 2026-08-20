# Restaurant POS Service, Open-Order and Channel Benchmark

Date: 2026-08-17
Status: Research evidence for current Rifad product discussion. This file is not implementation authorization.

Related delivery/API research:

- `DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`

## Question being answered

Rifad needs one POS family that can serve retail/direct selling, simple restaurants that only need local/takeaway kitchen identity, larger restaurants that need exact tables/rooms/sessions and open orders, and delivery-platform workflows without forcing unnecessary steps on the cashier.

The research focus is:

1. How do established POS products separate direct sales from restaurant service?
2. How do they represent open orders/tables/areas?
3. When are kitchen orders sent?
4. How do dine-in/takeaway/delivery interact with payment and pricing?
5. How do online delivery orders reach the POS with minimal cashier work?

## Official sources inspected

### Loyverse

- Open Tickets: https://help.loyverse.com/help/open-tickets
- Predefined Open Tickets / table naming: https://help.loyverse.com/help/how-use-predefined-open-tickets
- Dining Options: https://help.loyverse.com/help/dining-options
- Kitchen Printers: https://help.loyverse.com/help/using-kitchen-printers

Observed pattern:

- normal sales can be saved as open tickets and paid later;
- predefined ticket names can represent tables;
- Dining Options are separate attributes such as Dine in / Takeout / Delivery and appear on kitchen/KDS output;
- saving an open ticket can print the kitchen order immediately;
- later additions/removals can produce kitchen changes.

Strength: low training cost and simple mental model.

Limit for Rifad: table service is mainly a saved-ticket pattern and does not by itself solve richer rooms/sessions/areas or the requirement that a small restaurant should be able to mark **محلي** without managing exact places.

### Square for Restaurants

- Floor plans: https://squareup.com/help/us/en/article/6427-building-your-floor-plan
- Open tickets: https://squareup.com/help/us/en/article/5337-use-open-tickets-with-square
- Predefined tickets/groups: https://squareup.com/help/us/en/article/5809-use-predefined-tickets
- Dining options: https://squareup.com/help/au/en/article/5573-create-and-manage-dining-options
- Send & Stay: https://squareup.com/help/us/en/article/8612-set-up-send-stay-for-your-restaurant

Observed pattern:

- floor plans contain sections and tables and are operational during service;
- open checks are separate from immediate checkout;
- ticket groups can represent areas such as dining room/patio;
- dining option can be defaulted and carried to kitchen/reporting;
- kitchen sending can happen before final payment.

Strength: strong place visibility and realistic table service.

Trade-off: full floor-plan workflow is unnecessary for small restaurants that only need kitchen distinction between local and takeaway.

### Lightspeed Restaurant K-Series

- Floor plans and tables: https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804656709
- About floor plans: https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804656689
- POS configuration / direct sales vs table service: https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804606610
- Basic orders: https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050308894-Placing-basic-orders

Observed pattern:

- table service is distinct from direct sales;
- direct sales are paid immediately without needing a table/tab;
- a POS configuration can disable table support;
- floor plans can carry order-profile/printer configuration;
- areas and tables are first-class concepts.

Strength: validates that place management should be optional rather than forced into every restaurant/device.

### Odoo 19 POS Restaurant

- Restaurant features: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/restaurant.html
- Presets: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/extra/presets.html
- Preparation display: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/extra/preparation.html

Observed pattern:

- restaurant UI separates Tables, Register and Orders;
- a direct order can exist without a table or later be assigned to a table/tab;
- preparation send is separate from final payment;
- presets can change configuration/pricelist based on dine-in/takeout/delivery;
- preparation output can identify table/order/service context.

Important lesson: service, preparation and price context can be established independently from final payment.

### Toast

- Kitchen routing by dining option/service area: https://central.toasttab.com/articles/Knowledge/Print-Routing-by-Dining-Option

Observed pattern:

- kitchen routing may depend on dining option and service area;
- takeout/delivery can route differently.

Strength: confirms that local/takeaway/delivery is primarily useful as operational/kitchen context.

### Foodics and delivery-platform integrations

Foodics evidence is detailed in `DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`.

The important product lesson is that API orders can arrive directly in the POS, may be auto-accepted/sent to kitchen, and carry prepaid/unpaid state without requiring the cashier to recreate the order or choose the platform again.

---

# Rifad conclusion

Rifad should use one adaptable product model rather than separate retail/basic/advanced applications.

> **Direct sale core + optional restaurant-service semantics + optional advanced place management + one online-order experience backed by adapters.**

## 1. Restaurant service classification is optional

A branch/POS setting determines whether restaurant fulfillment semantics are active.

### Disabled

Suitable for retail/grocery/direct selling:

- no **محلي / سفري** decision is forced;
- the cashier sells and presses **دفع**;
- kitchen fulfillment terminology does not leak into a retail workflow.

### Enabled

Suitable for restaurants/cafes:

- pressing direct **دفع** means normal direct restaurant sale and is operationally **سفري**;
- **محلي** becomes available as the alternate local preparation path;
- delivery-platform flows can establish **توصيل**.

The cashier does not need a separate **سفري** button because direct payment already carries that default in restaurant-service mode.

## 2. Advanced place management is a separate optional setting

Do not equate `restaurant service enabled` with `table map required`.

### Simple local restaurant

Restaurant service ON, place management OFF:

`basket → محلي → checkout → kitchen receives محلي`

No table/room/session selection is required.

This covers restaurants with only a few tables or businesses that care about local/takeaway preparation but do not need to track exact seating.

### Advanced local restaurant

Restaurant service ON, place management ON:

`basket → محلي → choose service area/place → kitchen → clear working basket → open local order`

Use:

- Service Area: الصالة، الدور الأول، الغرف، الجلسات الخارجية...
- Service Place: طاولة 12، غرفة 3، جلسة 8...

Payment may happen before or after dining.

## 3. Open-order action is only needed when places/open local orders exist

Recommended label: **طلبات مفتوحة**.

When advanced mode has open local orders and the working basket is empty:

> **طلبات مفتوحة · N | دفع**

The physical action-card slots remain fixed while visual priority changes to the useful available action.

## 4. Fulfillment, channel and collection remain separate internally

Use durable concepts such as:

- fulfillment: `takeaway / dine_in / delivery`;
- sales channel: direct POS / Keeta / HungerStation / Jahez / Ninja / ...;
- payment/collection/settlement: cash, Mada/card, credit, prepaid platform, due on delivery, later platform settlement.

The UI can combine them into one convenient tile, but reporting/accounting/integration cannot rely on one overloaded field.

## 5. Delivery can look like a payment/completion choice without being only payment data

For manual/fallback entry, the cashier may see tiles such as **كيتا / هنقرستيشن** alongside completion/payment choices because this is fast and matches real staff language.

Internally the tile sets delivery fulfillment + channel + pricing context + collection state separately.

For an API-connected incoming order, the cashier should not select the platform at all; the order already arrives with those facts.

## 6. Channel-specific prices are required

Rifad should support:

- product base price;
- optional channel price list/product override;
- effective price snapshot;
- separate platform commission/settlement terms.

Example:

- Latte direct price;
- Keeta price 26;
- HungerStation price 25.

Manual platform entry recalculates the basket and visibly shows the changed total before completion.

API-connected platform orders preserve the external sold price snapshot rather than being silently rewritten to today's direct POS price.

## 7. Kitchen dispatch timing

Preparation is an order operation, not one universal payment side effect.

Intended direction:

- direct restaurant sale: kitchen output **سفري** in direct completion flow;
- simple local: kitchen output **محلي** in local completion/send flow;
- advanced local: kitchen output when assigned/sent to a service place;
- later advanced-local additions/voids: preparation deltas/revisions only;
- delivery: **توصيل** plus channel identity;
- API-connected online order: may auto-accept/send to kitchen when configured.

## 8. Delivery integrations should support direct adapters and aggregators

Where official/commercial access is practical, Rifad can implement a direct adapter per platform.

Where direct access is unavailable or costly to maintain, Rifad can use an approved aggregator adapter.

The cashier should not know or care which integration path is behind the order.

Target principle:

> **One online-order queue, many adapters behind it.**

## 9. Configuration ownership

During UI-first development, temporary POS settings are acceptable to prove:

- restaurant-service on/off;
- place-management on/off;
- service areas/places;
- delivery-channel/manual pricing behavior;
- online-order automation behavior.

Production ownership should move business-sensitive configuration to Back Office so ordinary cashiers cannot casually change service modes, integration credentials, branch mappings, menus/pricelists or reconciliation rules.

---

# What Rifad should borrow and what it should not

Borrow:

- Loyverse simplicity;
- Square/Lightspeed place visibility when the business actually needs it;
- Lightspeed's optional table-service idea;
- Odoo's separation of register/tables/orders/preparation/payment;
- Foodics' low-touch incoming-online-order pattern;
- aggregator pattern of one normalized queue and centralized menu management.

Do not copy:

- generic `Save` as permanent restaurant meaning;
- mandatory table selection for every local restaurant;
- mandatory dine-in/takeaway/delivery chooser on every sale;
- restaurant terminology in retail/direct POS mode;
- separate cashier workflow/tablet for every delivery platform;
- delivery-platform identity as only a payment method;
- platform commission hidden inside customer-facing product price.

## Implementation boundary

Before code is authorized:

1. reconcile `UI_EXECUTION_MANIFEST.json` with bounded restaurant-service and online-order flows;
2. define Rifad contracts for service configuration, places/open orders, fulfillment, channels, pricing, kitchen dispatch and delivery adapters;
3. define normalized external-order/payment/settlement records;
4. select a first adapter only after real credentials/test access are available;
5. update mock/local persistence intentionally;
6. then implement the owner-approved UI flow.
