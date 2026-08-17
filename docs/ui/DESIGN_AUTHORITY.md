# Rifad UI Authority Model

Last updated: 2026-08-17

## Purpose

Rifad separates product/workflow evidence from visual design authority. This lets the product learn from proven interfaces without copying another product blindly or allowing visual inspiration to change business behavior.

## Authority order

### 1. Rifad product decisions

`PROJECT_RULES.md`, current architecture decisions and approved product requirements are the final authority when any source conflicts.

### 2. Loyverse functional/workflow reference

The research under `docs/research/loyverse/` is the primary evidence for:

- screen and workflow inventory;
- navigation and information hierarchy;
- visible actions and their meaning;
- state transitions;
- permissions and prerequisite settings;
- offline-visible behavior;
- POS/KDS/CDS operational relationships;
- density and ergonomic baseline.

Loyverse is not a code dependency and does not own Rifad's identity, contracts or data model.

Cross-market research may refine a bounded workflow when Loyverse is too generic for the target operation. The current restaurant-service comparison is documented in `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`.

### 3. Rifad visual and interaction authority

Rifad's design system is the authority for:

- brand colors and tokens;
- typography;
- icons and original assets;
- spacing, radius, elevation and component styling;
- touch-target geometry and cashier ergonomics;
- accessibility treatment;
- animation values;
- final responsive composition while preserving approved behavior.

The provisional executable baseline is stored in `RIFAD_DESIGN_TOKENS.json`. It is approved only for the current UI work and must be promoted or changed through a visual decision before production design freeze. A developer must not invent a generic dashboard theme or unrecorded tokens to fill a gap.

### 4. Optional visual/operational donors

Other products or open-source interfaces may be proposed as narrow visual or operational donors. They are not approved merely because they look better or are mentioned in discussion. Each adoption requires an explicit decision record that identifies the exact pattern, affected Rifad screens and evidence.

Square, Lightspeed, Odoo or Toast may influence a bounded restaurant pattern only through recorded evidence/decision. Observable proprietary behavior may be used as inspiration/specification, but protected code, assets, branding or distinctive trade dress must not be copied. Direct code reuse requires license and dependency verification.

---

# Human-first interaction rule

The current binding POS design priority is:

> **Touch first, then human visual clarity, then beauty.**

This is not a slogan; it is an implementation rule.

## Touch first

- Frequent cashier actions should normally provide about 48 px or more of usable hit area when the display allows it.
- On short-height devices, important controls should remain around 44–48 px rather than collapsing into desktop-sized buttons.
- The visual icon may remain smaller than its hit area.
- Whole rows/cards should be tappable when the entire row/card represents one action.
- Primary actions such as Pay, Complete payment and New sale receive more touch/visual weight than secondary actions such as print or non-active alternatives.
- If space becomes constrained, alter layout, column count, wrapping, scrolling, or secondary information before shrinking the main touch targets.
- A frequent completion action must not require vertical scrolling merely because the viewport is shorter. Prefer making only the repeatable content list scroll while totals, required context and the primary completion action remain reachable.
- When a dedicated POS surface has room for repeated numeric entry, prefer an embedded numeric keypad over forcing a touch device to open its system soft keyboard. Hardware-keyboard entry may remain available as an additional path.
- **Reduce finger travel between consecutive transaction steps by preserving one two-slot transaction operation card.** The stable reference is the physical card/slots, not one permanently fixed green side.
- In the current ordinary RTL sale/payment sequence, the right slot is secondary/alternative/cancel and the left slot is the main completion slot.
- Current executable sequence is **حفظ | دفع → إلغاء الفاتورة | سداد/تم الدفع → طباعة | بيع جديد**. In Quick Sale with an empty ticket, **سداد | دفع** remains visible; disabled Pay is not hidden and debt settlement is not moved into the Pay slot.
- When the working basket is empty and open local orders exist, visual priority may swap without moving geometry: **طلبات مفتوحة · N** in the right slot becomes green/primary while the left-slot **دفع** remains disabled/neutral.
- Dynamic validation near a repeated keypad must reserve stable geometry so messages do not move the keypad or completion card between taps.

## Human visual clarity second

- Judge type size and contrast from a cashier's normal standing/seated viewing distance, not from a design-tool zoom level.
- Important money values must be readable at a glance.
- The next required action must be visually obvious without reading every helper sentence.
- Payment methods should use both text and strong visual recognition, not tiny icons or text-only rows when a better visual cue is available.
- Whitespace is useful only when it helps scanning and reachability; it must not make important information look undersized or lost.
- Status/results should not use the same filled-color treatment as the primary action when that makes them look equally actionable. Prefer calmer borders/backgrounds for read-only results.
- Helper text that only repeats an obvious, already-enforced field constraint should not consume normal-path vertical space unless it materially prevents errors.
- Kitchen/service status must not rely on color alone; text/label/state identity remains visible.

## Beauty third

Polish is important, but decorative density, symmetry, subtlety, photorealistic floor furniture, or visual novelty may not reduce touch reliability or glance readability.

---

# Responsive rule

Rifad POS is not designed for one screenshot size.

Every important visual pass must consider at least:

1. large cashier/desktop POS display;
2. 1366×768-class device;
3. tablet landscape;
4. short-height POS display;
5. mobile/narrow composition.

When the viewport changes, **layout may change before touch size changes**.

Phone is allowed to use a different composition from tablet/desktop. Do not compress a split-screen desktop/tablet surface into unusably small columns merely to preserve geometry.

For transaction rails and baskets, the preferred fallback is:

- keep totals and the two-slot operation card outside the scrolling content region;
- let long item/content lists absorb the scroll;
- reduce decorative spacing before reducing key hit targets;
- avoid introducing an extra navigation or reveal step solely because the display is smaller;
- preserve operation-card slot coordinates across adjacent transaction states when doing so does not harm touch or readability;
- sale basket and checkout/success rail use the same physical width on desktop/tablet so **بيع جديد** does not create a horizontal jump.

For data-entry forms, responsive density may intentionally differ by device class. The current customer-entry rule is:

- desktop/wide quick customer information uses three columns;
- desktop/wide additional customer information uses **three real grid columns** to reduce vertical scrolling;
- narrow/mobile quick and additional information use one column for easier sequential touch entry;
- do not preserve desktop columns on a phone by shrinking fields.

---

# Restaurant operational interaction rule

This section records product/interaction direction; the full restaurant flow is **not yet implementation-authorized**.

## Do not ask the cashier an unnecessary order-type question

**محلي / سفري / توصيل** is primarily fulfillment/kitchen context.

- direct POS sale defaults to **سفري** operationally;
- do not force a `سفري` selection on every direct sale;
- **محلي** is explicit because it requires assigning a service place/open order;
- **توصيل** is usually established by a delivery sales channel/order workflow.

## Local action replaces generic Save in table-service mode

When table/local service is enabled and the working basket has items, the target operation card is:

> **محلي | دفع**

`محلي` opens place assignment. It is not a prettier label for the old generic Save command.

When the table/local-service setting is disabled, do not show an irrelevant local-management action merely to fill space.

## Open-order state

When the basket is empty and local orders exist:

> **طلبات مفتوحة · N | دفع**

- physical card geometry stays fixed;
- **طلبات مفتوحة** becomes the green priority action in its existing right slot;
- **دفع** remains in its existing left slot but is silver/neutral and disabled;
- once the cashier starts a new basket, the card returns to **محلي | دفع** and Pay regains green priority.

Recommended wording is **طلبات مفتوحة**, not `التذاكر المفتوحة`, because it matches the operational task.

## Service-area/place view

The target is a semantic spatial view, not a decorative floor-plan screenshot clone.

Wide/tablet:

- area tabs such as **الصالة / الغرف / الجلسات الخارجية**;
- large place targets such as **طاولة 12 / غرفة 3 / جلسة 8**;
- approximate the real physical arrangement enough to build staff spatial memory;
- a place can expose status, elapsed time and amount when these facts are useful;
- normal occupied state should not be red; red is reserved for destructive/error/urgent attention.

Mobile/narrow:

- convert the place map to readable cards/list by area;
- do not shrink a desktop floor plan until touch targets become tiny.

Persistent editing of areas/place positions belongs in Back Office later. Temporary POS settings are acceptable only as staging configuration during UI-first work.

## Delivery/platform channel interaction

A tile/button for Keeta/HungerStation/Ninja may be a one-touch cashier shortcut, but the UI must not imply that channel, fulfillment and payment are the same business field.

If selecting the platform changes product prices:

1. apply the channel pricing context;
2. recalculate the ticket;
3. show the updated total;
4. only then allow final completion.

---

# Current accepted POS interaction direction

The active POS branch has established these interaction decisions:

- product tiles are large touch targets;
- the product card is the primary source for unit price while basket rows emphasize quantity × item and row total;
- repeated item addition should emphasize quantity feedback rather than animate the whole basket row unnecessarily;
- long baskets scroll only their item list while ticket totals, required order context and **دفع** stay outside that scrolling region;
- **مسح السلة** appears from the first item as a lighter-red one-touch row inside the basket body, after the ticket header and before item lines; its visible copy is only **مسح السلة** and it never changes header/footer geometry;
- tapping a ticket line opens a touch-first quantity editor with large `+ / −`, direct numeric entry, an embedded POS keypad including `00` and backspace, and one safe confirmation write;
- checkout does not navigate away from the sale context; the basket rail transforms through payment stages while the product catalog remains visible as frozen context;
- checkout progression is conceptually `basket → payment methods → cash/card → success`;
- the cash rail keeps the change result visually distinct from the filled **سداد** action and keeps the completion action reachable without scrolling in the normal path;
- the transaction operation card keeps the same two physical slots through sale, payment completion and sale success;
- sale/payment/success share one rail width on desktop/tablet to eliminate the visual jump after **بيع جديد**;
- before payment completion, **إلغاء الفاتورة** occupies the secondary red slot and returns to a fresh sale without creating a receipt in the current prototype;
- success emphasizes the result the cashier needs next, especially cash change, and keeps **طباعة | بيع جديد** in the same operation-card geometry;
- the always-print preference is presented as a quickly scannable printer row rather than a long undifferentiated sentence;
- payment-method cards use strong visual recognition in addition to their Arabic labels;
- card/شبكة/مدى UX may be mocked for product validation, but production terminal support is not claimed until the terminal/provider adapter is proven.

Canonical cashier-facing labels and UI-to-data fields are maintained in `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

---

## What visual improvement may change

With an approved visual decision, Rifad may improve:

- color, typography and icon treatment;
- spacing and component polish;
- information legibility and accessibility;
- touch-target geometry;
- responsive composition;
- feedback animation and transition quality;
- empty/loading/error presentation.

## What visual improvement may not change silently

Visual work may not silently change:

- workflow steps or action meaning;
- contract calls or durable state transitions;
- permissions and authorization prompts;
- offline availability or synchronization semantics;
- fiscal, money or payment behavior;
- KDS/CDS operational propagation;
- required information or audit evidence;
- fulfillment, sales-channel or price authority.

Changing any item above requires a product/architecture decision and, where applicable, a manifest update before the behavior is considered production-approved.

## Visual reference decision record

Create one record per adopted pattern under `docs/ui/visual-decisions/` with:

- decision ID and status;
- source product/repository and exact URL/version/date inspected;
- affected screen/flow IDs when available;
- pattern being adopted;
- functional behavior that must remain unchanged;
- reuse mode: inspiration / behavioral reference / direct licensed reuse;
- license, asset and attribution review where applicable;
- RTL, accessibility and device-size consequences;
- screenshots/test fixtures used as acceptance evidence;
- approver and decision date.

## Implementation rule

The UI Execution Manifest names the required behavior. The Rifad design system decides its final appearance. An approved visual donor may influence styling only within that boundary.

For every new visible POS field or label, also update `POS_UI_NAMING_AND_FIELD_REGISTER.md` so later database work cannot forget UI-required data.
