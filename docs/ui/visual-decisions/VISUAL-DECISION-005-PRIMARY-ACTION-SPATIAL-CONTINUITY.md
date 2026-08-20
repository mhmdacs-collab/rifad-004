# VISUAL-DECISION-005 — Transaction Operation Card Continuity

Status: **owner visually accepted for the current sale/payment/clear-cart/zero-jump behavior; restaurant-state extension documented separately and pending implementation**

Date: 2026-08-17

## Decision

Rifad POS minimizes cashier finger travel by keeping the **same two-slot operation card** in the same lower transaction zone as the sale advances.

The important rule is not merely visual similarity. The two normal transaction buttons must reuse the **same horizontal columns, bottom inset, padding, gap, touch height and card width** as the sale footer. Checkout and success do not get a merely similar footer; they inherit the same operation-card geometry.

For the current ordinary RTL sale/payment composition:

- the right slot is normally the secondary / alternative / cancel slot;
- the left slot is normally the main transaction-completion slot;
- the bottom two-button row keeps the same physical coordinates relative to the transaction rail;
- the card remains visually and spatially stable across sale, payment and success stages;
- **helper or destructive utilities must not be inserted into this operation card if their appearance changes its height or moves the two slots.**

Current executable sequence:

- normal sale prototype: **حفظ | دفع**;
- Quick Sale empty ticket: **سداد | دفع** (Pay remains visible but disabled until a sale exists);
- cash checkout: **إلغاء الفاتورة | سداد**;
- card/mock checkout: **إلغاء الفاتورة | تم الدفع**;
- completed sale: **طباعة | بيع جديد**.

`إلغاء الفاتورة` is intentionally red but calm, because it abandons the unpaid transaction and starts a fresh sale without creating a receipt in the current prototype.

The prototype **حفظ** label is not the final restaurant meaning; see the restaurant extension below.

## Zero-jump transaction rail width

The operation buttons cannot stay in the same physical place if the sale basket and checkout/success rail are merely *similar* widths. They must resolve from the **same shared rail-width variable**.

Therefore on desktop/tablet cashier surfaces:

- the sale workspace basket column and inline payment/success rail use one shared physical width;
- responsive tablet width is also shared rather than independently approximated;
- `طباعة | بيع جديد` returning to `حفظ/سداد | دفع` must not introduce a horizontal target shift;
- stage-specific button icons or copy remain centered inside the same physical button slots.

Mobile uses the full-width transaction surface, so this desktop/tablet rail-width constraint does not force a narrow mobile column.

## Clear Cart without moving the main buttons

From the first basket item, the sale surface exposes **مسح السلة** so a cashier does not have to open and delete many individual lines.

The clear action follows these geometry rules:

- it is **not part of the transaction operation card**;
- it lives **inside the basket panel itself**, immediately after the ticket header and directly before the basket lines;
- it reads visually like a special basket row/utility rather than a second header or footer;
- its appearance consumes space from the flexible basket-line area only;
- adding/removing it must not alter the ticket header or the height, bottom inset, columns or position of the transaction footer;
- it uses a clear but softer solid red destructive treatment while remaining spatially separated from the catalog/product grid;
- its visible copy is intentionally minimal: **مسح السلة** only, beside the delete icon;
- it remains a large one-touch target, disappears when the basket is empty, and clears current basket lines using existing line-removal behavior without creating a receipt.

The current UI maps the bulk affordance to the already-authorized line-removal action (`SALES-ACTION-004`) rather than inventing a new durable field or payment command.

## Why the current implementation changed several times

Earlier interpretations were corrected through live visual review:

1. Quick Sale debt **سداد** was incorrectly moved into the Pay slot and disabled Pay was hidden. The corrected rule preserves **سداد + دفع**.
2. **مسح السلة** was placed inside the operation card and allowed the card to grow upward. That changed the operation card itself and could move visible completion actions.
3. Clear Cart was then isolated above the entire basket panel. That protected the footer but introduced a new strip outside the ticket body. The corrected rule places it inside the basket, between header and first item.
4. The sale basket and checkout rail used different responsive width formulas. Even with identical footer CSS this caused a small horizontal jump after **بيع جديد**. The corrected rule shares the rail width itself, not only button CSS.

## Restaurant/open-order extension

Market research and owner discussion now add a state that requires refining the earlier assumption that the left slot is *always* the visually primary one.

When table/local service is enabled and the working basket has items, the target restaurant sale card is:

> **محلي | دفع**

- **محلي** occupies the same right slot as the old generic Save action;
- **دفع** stays in the left slot and remains primary for immediate direct sale.

When the working basket is empty and open local orders exist:

> **طلبات مفتوحة · N | دفع**

- the physical slots, card size and button coordinates **do not move**;
- **طلبات مفتوحة** remains in the right slot but becomes green/primary because reopening an existing order is the useful action;
- **دفع** remains in the left slot but becomes neutral/silver and disabled because the working basket is empty.

This is an intentional priority swap, not a geometry swap.

Once products are added to a new working basket, the card returns to **محلي | دفع** and Pay regains primary emphasis.

See `VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md`. This restaurant behavior is documented but not yet implemented/manifest-authorized.

## Scroll relationship

This decision extends D-021:

- repeated content and optional fields absorb scrolling first;
- the transaction operation card stays outside or at the stable edge of scrolling content;
- Clear Cart consumes flexible basket-line space rather than header/footer/operation-card space;
- cash/card/success operation footers are structural siblings of their scrollable body so body padding cannot shift their placement;
- dynamic validation must not move keypad or action card;
- shorter screens reclaim spacing before shrinking action targets.

## Customer-form density

Customer entry follows the same layout-before-shrink principle:

- quick information: three columns on desktop/wide POS surfaces;
- additional information: **three real grid columns** on desktop/wide POS surfaces;
- narrow/mobile: one column for both groups;
- helper text that repeats an already-enforced obvious constraint should not consume vertical space in the normal entry path.

## Affected current POS surfaces

Implemented/current:

- basket header: unchanged;
- basket body: **مسح السلة** as the first special row when items exist;
- basket footer: prototype **حفظ / دفع** two-slot card;
- Quick Sale empty-ticket footer: **سداد / دفع**;
- cash/card completion: **إلغاء الفاتورة / سداد أو تم الدفع**;
- sale success: **طباعة / بيع جديد**;
- shared basket/payment/success rail width on desktop/tablet;
- customer creation additional-information density.

Documented next restaurant state, not implemented:

- **محلي / دفع** for a working restaurant basket;
- **طلبات مفتوحة · N / دفع** with state-driven color-priority inversion when the basket is empty.

Debt-book settlement remains its own operational dialog and follows D-021 for stable footer reachability; it is not used to redefine the sale-screen debt **سداد + دفع** relationship.

## Data consequence

The current operation-card position, shared rail width, Clear Cart presentation and column count are UI/interaction decisions and add no durable business fields.

The future restaurant extension **does** depend on durable restaurant/open-order data such as table-service enablement, service places and open-order count/status; those requirements are registered in `POS_UI_NAMING_AND_FIELD_REGISTER.md` and `VISUAL-DECISION-006`.

`إلغاء الفاتورة` currently uses the prototype new-sale/reset path before payment completion. Production cancellation/audit semantics must be defined by the sale/checkout domain before this behavior is treated as a fiscal/accounting cancellation record.
