# Rifad UI Authority Model

Last updated: 2026-08-17

## Purpose

Rifad separates product/workflow evidence from visual design authority. This lets the product learn from proven interfaces without copying another product blindly or allowing visual inspiration to change business behavior.

## Authority order

### 1. Rifad product decisions

`PROJECT_RULES.md`, current architecture decisions and approved product requirements are final when sources conflict.

### 2. Loyverse functional/workflow reference

Research under `docs/research/loyverse/` remains the primary baseline for screen/workflow inventory, navigation, visible actions, states, prerequisites, offline-visible behavior, POS/KDS/CDS relationships and ergonomic density.

Loyverse is not a code dependency and does not own Rifad identity, contracts or data model.

Cross-market research may refine bounded workflows when Loyverse is too generic. Current restaurant/delivery research:

- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`
- `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`

### 3. Rifad visual and interaction authority

Rifad owns:

- colors/tokens;
- typography;
- icons/assets;
- spacing/radius/elevation;
- touch geometry and cashier ergonomics;
- accessibility;
- animation;
- final responsive composition while preserving approved behavior.

`RIFAD_DESIGN_TOKENS.json` is provisional for current UI work until promoted/changed through explicit design decisions.

### 4. Optional visual/operational donors

Other products may influence narrow patterns only through recorded evidence/decision. Square, Lightspeed, Odoo, Toast, Foodics, Deliverect, UrbanPiper or others do not receive blanket authority.

Observable behavior may be used as inspiration/specification; proprietary code/assets/branding/trade dress must not be copied. Direct code reuse requires license/dependency verification.

---

# Human-first interaction rule

> **Touch first, then human visual clarity, then beauty.**

## Touch first

- Frequent cashier actions should normally provide about 48px+ usable hit area when possible.
- Short-height devices should keep important controls around 44–48px instead of collapsing to desktop-sized buttons.
- Visual icons may be smaller than hit areas.
- Whole rows/cards should be tappable when the entire surface represents one action.
- Active completion actions receive more visual/touch weight than secondary or inactive alternatives.
- If space is constrained, alter layout/columns/wrapping/scrolling/secondary information before shrinking main targets.
- Frequent completion actions must not require vertical scrolling merely because viewport height is shorter.
- Dedicated repeated numeric entry should prefer embedded POS keypads while retaining hardware keyboard support.
- **Reduce finger travel by preserving one two-slot transaction operation card.** The stable reference is physical geometry, not one permanently fixed green side.
- Ordinary RTL flow currently uses right slot for secondary/alternative/cancel and left slot for main completion.
- Executable sequence: **حفظ | دفع → إلغاء الفاتورة | سداد/تم الدفع → طباعة | بيع جديد**. Quick Sale empty keeps **سداد | دفع** with disabled Pay visible.
- Advanced restaurant empty-basket/open-order state may swap visual priority without moving geometry: **طلبات مفتوحة · N** becomes green in right slot while left-slot **دفع** stays disabled/neutral.
- Dynamic validation near a repeated keypad must reserve stable geometry.

## Human visual clarity second

- Judge type/contrast from normal cashier viewing distance.
- Important money values must read at a glance.
- Next required action must be obvious without reading every helper sentence.
- Payment/collection methods should use text plus strong visual recognition.
- Whitespace must help scanning/reachability, not make key information look tiny or lost.
- Read-only results should not look as actionable as primary filled buttons.
- Repetitive helper text should not consume normal-path space unless it materially prevents errors.
- Kitchen/service/online-order status must not rely on color alone.

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

- totals and two-slot operation card stay outside scrolling content;
- long repeatable lists absorb scrolling;
- decorative spacing reduces before hit targets;
- do not add navigation/reveal steps solely because the display is smaller;
- preserve operation-slot coordinates across adjacent states where usable;
- sale basket and checkout/success rail use one physical desktop/tablet width so **بيع جديد** creates no horizontal jump.

Customer-entry density:

- desktop/wide quick information = three columns;
- desktop/wide additional information = three real grid columns;
- narrow/mobile = one column;
- never preserve desktop columns by shrinking phone fields.

---

# Restaurant operational interaction rule

This is product/interaction direction; full restaurant flow is not implementation-authorized yet.

## Restaurant semantics are optional

Rifad must not ask retail/grocery/direct-sale users restaurant questions they do not need.

### Restaurant service OFF

- no permanent **محلي / سفري** workflow;
- normal sale simply uses **دفع**;
- suitable for retail/direct POS.

### Restaurant service ON

- direct **دفع** means restaurant direct sale and is operationally **سفري** without an extra tap;
- **محلي** becomes available as the local-service alternative;
- delivery platforms may establish **توصيل** through their own order/channel flow.

## Place management is a separate optional layer

Do not equate restaurant service with mandatory tables.

### Simple restaurant: place management OFF

Target with basket items:

> **محلي | دفع**

- **دفع** = direct **سفري** checkout;
- **محلي** = mark dine-in/local and proceed to checkout;
- no table/room/session selector;
- kitchen receives **محلي**.

This supports restaurants with only a few tables or no operational need to identify exact seating.

### Advanced restaurant: place management ON

Target with basket items:

> **محلي | دفع**

- **دفع** = direct **سفري** checkout;
- **محلي** opens service-area/place selection;
- selecting a place assigns an open local order, sends kitchen work and clears the main working basket;
- payment may happen before or after dining.

## Advanced open-order state

Only place-managed mode needs this shortcut.

Empty basket + open local orders:

> **طلبات مفتوحة · N | دفع**

- physical card stays fixed;
- **طلبات مفتوحة** becomes green/primary in right slot;
- **دفع** stays left but silver/neutral and disabled;
- adding a new item returns to **محلي | دفع**, with Pay primary again.

Recommended wording: **طلبات مفتوحة**, not `التذاكر المفتوحة`.

## Service-area/place view

Wide/tablet:

- area tabs such as **الصالة / الدور الأول / الغرف / الجلسات الخارجية**;
- large places such as **طاولة 12 / غرفة 3 / جلسة 8**;
- approximate real arrangement enough to aid spatial memory;
- show useful status/elapsed time/amount when relevant;
- normal occupied state is not red.

Mobile/narrow:

- use readable cards/list grouped by area;
- do not shrink a desktop floor plan into tiny targets.

Persistent area/place editing belongs in Back Office later. Temporary POS settings are staging only.

---

# Delivery / online-order interaction rule

## One cashier experience, many adapters

Do not create a separate cashier workflow for every delivery platform.

Target principle:

> **One online-orders experience for the cashier, many direct or aggregator adapters behind it.**

Platform identity stays visible on each order, but connector mechanics stay out of the normal cashier flow.

## API-connected order

When an order arrives through an integration:

- cashier does **not** select Keeta/HungerStation/Jahez again;
- cashier does **not** retype products/prices;
- order already carries channel, external reference, sold prices and payment/collection state when supplied;
- branch policy may auto-accept and auto-send to kitchen;
- if manual acceptance is required, use one large obvious accept/decline action rather than platform-specific navigation.

Compact labels may read:

- **كيتا · مدفوع**;
- **هنقرستيشن · نقد عند الاستلام**;
- **جاهز · مدفوع**.

## Prepaid versus due-on-delivery

- prepaid platform order must not ask cashier to collect cash/Mada again;
- cash/card due on delivery/pickup remains unpaid until actual collection;
- a future collection promise must never render as completed payment;
- platform settlement later must not create a duplicate sale.

## Manual/fallback platform entry

A platform tile may appear beside payment/completion choices when:

- platform is not API-connected;
- integration is temporarily unavailable and fallback is allowed;
- staff are authorized to record an external order manually.

The tile can feel like a payment option for speed, but internally it sets separate channel + delivery fulfillment + channel pricing + collection state.

## Pricing

Manual platform entry:

1. apply channel pricelist/override;
2. recalculate ticket;
3. visibly show changed total;
4. only then permit final completion.

API-connected order:

- preserve external sold price snapshots;
- validate/map product identities;
- do not overwrite platform order with current direct-POS base prices.

Platform commission/settlement fees remain separate from customer-facing product price.

## Kitchen

- direct restaurant Pay → **سفري**;
- simple local → **محلي** without required place;
- advanced local → **محلي + place** when assigned/sent;
- advanced local additions/voids → preparation deltas/revisions;
- delivery → **توصيل + channel** where useful;
- API-connected delivery may auto-send to kitchen after acceptance according to branch policy.

---

# Current accepted executable POS direction

- product tiles are large touch targets;
- product card owns unit-price visibility; basket emphasizes quantity × item and row total;
- repeated item addition emphasizes quantity feedback;
- long baskets scroll only item list while totals/context/**دفع** stay reachable;
- **مسح السلة** appears from first item as lighter-red one-touch row after ticket header/before lines, with only the label **مسح السلة**;
- tapping ticket line opens touch-first quantity editor with large `+ / −`, direct numeric entry, keypad `00`/backspace and one safe confirmation;
- checkout transforms basket rail while catalog remains visible/frozen;
- progression = `basket → payment methods → cash/card → success`;
- cash change remains visually distinct from **سداد**;
- transaction card uses same physical slots across sale/payment/success;
- sale/payment/success share one rail width desktop/tablet;
- **إلغاء الفاتورة** is calm-red pre-settlement destructive action and resets unpaid prototype without receipt;
- success keeps **طباعة | بيع جديد** in same geometry;
- always-print preference is a scannable printer row;
- payment-method cards use strong visual recognition;
- mock card UX does not imply production terminal support.

Canonical labels/data fields live in `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

---

## What visual improvement may change

With an approved decision, Rifad may improve:

- color/typography/icons;
- spacing/component polish;
- legibility/accessibility;
- touch geometry;
- responsive composition;
- feedback/animation;
- empty/loading/error presentation.

## What visual improvement may not change silently

Visual work may not silently change:

- workflow/action meaning;
- contract/durable state transitions;
- permissions;
- offline/sync semantics;
- fiscal/money/payment behavior;
- KDS/CDS propagation;
- required audit evidence;
- fulfillment/channel/price authority;
- external-order payment/collection meaning.

Changing these requires product/architecture decision and, where applicable, manifest update.

## Visual reference decision record

One record per adopted pattern under `docs/ui/visual-decisions/`, including status, source/date, affected flow/screen, pattern, preserved behavior, reuse mode, license/asset review, RTL/accessibility/device consequences, evidence and approval.

## Implementation rule

UI Execution Manifest names permitted behavior. Rifad design system decides appearance. Approved donors may influence styling/interaction only within that boundary.

Every new visible durable POS field/label must also update `POS_UI_NAMING_AND_FIELD_REGISTER.md`.
