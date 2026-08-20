# Rifad UI Authority Model

Last updated: 2026-08-17

## Purpose

Rifad separates product/workflow evidence from visual design authority. Proven products may inform bounded behavior without becoming Rifad's architecture, identity or visual owner.

## Authority order

1. `PROJECT_RULES.md` + current product/architecture decisions.
2. Loyverse research as the primary functional/workflow baseline.
3. Rifad design system as final visual/interaction authority.
4. Other donors only through explicit bounded research/decision records.

Current cross-market restaurant/delivery research:

- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`
- `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`

Square, Lightspeed, Odoo, Toast, Foodics, Deliverect, UrbanPiper, Grubtech or other products do not receive blanket authority. Proprietary code/assets/branding/trade dress must not be copied.

---

# Human-first interaction rule

> **Touch first, then human visual clarity, then beauty.**

## Touch first

- Frequent cashier actions should normally provide about 48px+ usable hit area when possible.
- Short-height devices retain about 44–48px important controls before further shrinking.
- Whole rows/cards should be tappable when the surface represents one action.
- Change layout/columns/wrapping/scrolling/secondary information before shrinking primary targets.
- Frequent completion actions should not require normal-path vertical scrolling.
- Repeated numeric touch entry should prefer embedded POS keypads while preserving hardware keyboard support.
- Dynamic validation near keypads reserves stable geometry.
- Reduce finger travel by preserving one two-slot transaction operation card.

## Stable transaction geometry

The stable reference is physical slot geometry, not one permanently green side.

Current RTL transaction states can include:

- restaurant basket: **محلي | دفع**;
- advanced empty basket + open orders: **طلبات مفتوحة · N | دفع**;
- reopened advanced local order: **إرسال | دفع**;
- Quick Sale empty: **سداد | دفع**;
- cash: **إلغاء الفاتورة | سداد**;
- mock card: **إلغاء الفاتورة | تم الدفع**;
- success: **طباعة | بيع جديد**.

In the advanced open-order state, Open Orders may become green while Pay becomes neutral/disabled, without moving either slot.

Sale basket and checkout/success rail use the same desktop/tablet physical width so **بيع جديد** creates no horizontal jump.

## Human visual clarity second

- Judge type/contrast from normal cashier distance.
- Important money values must read at a glance.
- The next required action must be obvious without reading helper paragraphs.
- Payment/collection methods should combine text and strong recognition.
- Whitespace must help scanning/reachability, not make key information look lost.
- Read-only results must not compete visually with active primary actions.
- Red remains destructive/error/urgent, not the normal state for an occupied restaurant place.
- Service/online-order status must not depend on color alone.

## Beauty third

Decorative density, symmetry, subtlety, photorealistic floor furniture or novelty may not reduce touch reliability or glance readability.

---

# Responsive rule

Important passes consider:

1. large desktop/POS;
2. 1366×768;
3. tablet landscape;
4. short-height POS;
5. mobile/narrow.

**Layout may change before touch size changes.** Phone may use a different composition from desktop/tablet.

Transaction/basket fallback:

- totals and action card stay outside scrolling content;
- long repeatable lists absorb scrolling;
- decorative spacing reduces before hit targets;
- avoid extra reveal/navigation steps solely because the viewport is smaller;
- preserve operation-slot coordinates where practical.

Customer entry:

- desktop/wide quick information = 3 columns;
- desktop/wide additional information = 3 real columns;
- mobile/narrow = 1 column.

---

# Restaurant operational interaction rule

`POS-FLOW-002` now implements the first mock/local executable subset of this rule. Behavior tests are green; final visual acceptance remains owner review.

The current prototype does not imply production KDS/printer transport, multi-device table synchronization or final restaurant persistence.

## Restaurant semantics are optional

Rifad must not ask retail/grocery/direct-sale users restaurant questions they do not need.

### Restaurant service OFF

- no normal-path **محلي / سفري** wording;
- normal sale uses **دفع**;
- suitable for retail/direct POS.

### Restaurant service ON

- direct **دفع** is operationally **سفري** without another tap;
- **محلي** is the local-service alternative;
- delivery platforms may establish **توصيل** through their own order/channel flow.

## Place management is a separate optional layer

### Simple restaurant — place management OFF

With basket items:

> **محلي | دفع**

- **دفع** = direct takeaway checkout;
- **محلي** = one-touch dine-in/local checkout;
- no table/room/session selection.

### Advanced restaurant — place management ON

With basket items:

> **محلي | دفع**

- **دفع** = direct takeaway checkout;
- **محلي** opens service-area/place selection;
- selecting a free place stores a mock open local order, records mock kitchen revision, and clears the working basket;
- payment may happen later after reopening the place.

## Advanced open-order state

Empty basket + open local orders:

> **طلبات مفتوحة · N | دفع**

- physical card stays fixed;
- Open Orders is green/primary in the right slot;
- Pay stays left, neutral/disabled.

Reopened occupied place:

> **إرسال | دفع**

- **إرسال** updates the stored mock order/revision and clears the working basket;
- **دفع** uses the existing checkout;
- successful payment releases the stored place.

## Service-area/place view

Current first visual pass:

- area tabs: **الصالة / الغرف / الجلسات**;
- large place cards for tables/rooms/sessions;
- occupied cards may show elapsed time and amount;
- wide view uses a clean semantic grid rather than decorative furniture;
- tablet compacts columns before shrinking touch targets;
- mobile uses one-column readable cards.

The owner has not yet visually accepted this exact place-card composition; it is intentionally ready for evaluation/modification.

Persistent place editing belongs in Back Office later. POS configuration is staging only.

---

# Delivery / online-order interaction rule

This remains researched product direction and is not implemented by POS-FLOW-002.

## One cashier experience, many adapters

> **One online-orders experience for the cashier, many direct or aggregator adapters behind it.**

## API-connected order

- cashier does not select Keeta/HungerStation/Jahez again;
- cashier does not retype products/prices;
- order carries channel/reference/sold prices/payment-collection state when supplied;
- branch policy may later support auto-accept + auto-send to kitchen.

Compact identity examples:

- **كيتا · مدفوع**
- **هنقرستيشن · نقد عند الاستلام**
- **جاهز · مدفوع**

## Prepaid versus due-on-delivery

- prepaid platform order must not trigger second cash/Mada collection;
- due-on-delivery/pickup remains unpaid until actual collection;
- later platform settlement must not create duplicate sale.

## Manual fallback

A platform tile may exist for unconnected/fallback/manual-entry scenarios. It may feel like a completion choice, but internally channel, delivery fulfillment, pricing and collection state remain separate.

## Pricing

Manual platform entry:

1. apply channel price context;
2. recalculate;
3. show changed total;
4. then allow completion.

API-connected order preserves actual external sold-price snapshots and validates mapping rather than replacing them with current direct-POS price.

---

# Current accepted executable POS direction

Owner-accepted/current behavior includes:

- large product touch targets;
- basket `quantity × item → row total`;
- isolated basket scrolling with stable totals/actions;
- **مسح السلة** as lighter-red one-touch row inside basket body with minimal copy;
- touch-first quantity editor + keypad;
- inline checkout preserving catalog context;
- stable transaction geometry and shared rail width;
- calm-red **إلغاء الفاتورة** before settlement;
- **طباعة | بيع جديد** in the same geometry;
- scannable always-print preference;
- 3-column desktop customer details / 1-column mobile;
- stable customer/debt keypad feedback;
- mock card UX with explicit production-terminal boundary.

New local-service behavior is executable and behavior-tested, but its exact colors, place-card density, labels and visual composition remain **owner-review pending**.

---

## What visual improvement may change

With an approved decision Rifad may change color, typography, icons, spacing, component polish, legibility/accessibility, touch geometry, responsive composition, feedback/animation, and empty/loading/error presentation.

## What visual work may not change silently

Do not silently change:

- workflow/action meaning;
- contract/durable transitions;
- permissions;
- offline/sync semantics;
- fiscal/money/payment behavior;
- KDS/CDS propagation;
- required audit evidence;
- fulfillment/channel/price authority;
- external-order payment/collection meaning.

These require product/architecture/manifest updates where applicable.

## Visual-decision records

Each adopted pattern gets a record under `docs/ui/visual-decisions/` naming status, evidence/source/date, affected flow/screen, preserved behavior, reuse mode, licensing/asset boundary, RTL/accessibility/device consequences and acceptance evidence.

## Implementation rule

The UI Execution Manifest names permitted behavior. The Rifad design system decides appearance. Every new visible durable field/label must also update `POS_UI_NAMING_AND_FIELD_REGISTER.md`.
