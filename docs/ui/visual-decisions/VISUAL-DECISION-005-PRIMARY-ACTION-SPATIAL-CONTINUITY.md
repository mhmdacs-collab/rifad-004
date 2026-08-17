# VISUAL-DECISION-005 — Transaction Operation Card Continuity

Status: **current owner-directed POS interaction rule; final visual review pending**

Date: 2026-08-17

## Decision

Rifad POS minimizes cashier finger travel by keeping the **same two-slot operation card** in the same lower transaction zone as the sale advances.

The important rule is not merely visual similarity. The two normal transaction buttons must reuse the **same horizontal columns, bottom inset, padding, gap, touch height and card width** as the original sale footer. Checkout and success do not get a merely similar footer; they inherit the same operation-card geometry.

For the current RTL POS composition:

- the right slot is the secondary / alternative / cancel slot;
- the left slot is the main transaction-completion slot;
- the bottom two-button row keeps the same physical coordinates relative to the transaction rail;
- the card remains visually and spatially stable across the sale, payment and success stages;
- **helper or destructive utilities must not be inserted into this operation card if their appearance changes its height or moves the two primary slots.**

Current intended sequence:

- normal sale: **حفظ | دفع**;
- Quick Sale empty ticket: **سداد | دفع** (Pay remains visible but disabled until a sale exists);
- cash checkout: **إلغاء الفاتورة | سداد**;
- card/mock checkout: **إلغاء الفاتورة | تم الدفع**;
- completed sale: **طباعة | بيع جديد**.

`إلغاء الفاتورة` is intentionally red but calm, because it abandons the unpaid transaction and starts a fresh sale without creating a receipt in the current prototype.

## Clear Cart without moving the main buttons

From the first basket item, the sale surface exposes **مسح السلة** so a cashier does not have to open and delete many individual lines.

The clear action follows these geometry rules:

- it is **not part of the transaction operation card**;
- it lives **inside the basket panel itself**, immediately after the ticket header and directly before the basket lines;
- it reads visually like a special basket row/utility rather than a second header or footer;
- its appearance consumes space from the flexible basket-line area only;
- adding/removing it must not alter the ticket header or the height, bottom inset, columns or position of **حفظ/سداد | دفع**;
- it uses a strong solid red destructive treatment, comparable in visual weight to the green Pay action, while remaining spatially separated from the catalog/product grid;
- it remains a large one-touch target, disappears when the basket is empty, and clears the current basket lines using the existing line-removal behavior without creating a receipt.

The current UI maps the bulk affordance to the already-authorized line-removal action (`SALES-ACTION-004`) rather than inventing a new durable field or payment command.

## Why this is different from the previous interpretation

Three earlier interpretations were corrected:

1. Quick Sale debt **سداد** was incorrectly moved into the Pay slot and disabled Pay was hidden. The corrected rule preserves **سداد + دفع**.
2. **مسح السلة** was placed inside the operation card and allowed the card to grow upward. That changed the operation card itself and could move the visible completion actions on real screens.
3. Clear Cart was then isolated **above the entire basket panel**. That protected the footer but visually introduced a new strip between the surrounding layout and the ticket header. The corrected rule keeps both ticket header and transaction footer intact by placing Clear Cart **inside the basket body, between the header and the first item**.

## Scroll relationship

This decision extends D-021:

- repeated content and optional fields absorb scrolling first;
- the transaction operation card stays outside or at the stable edge of scrolling content;
- Clear Cart consumes flexible basket-line space rather than header/footer or operation-card space;
- cash/card/success operation footers are structural siblings of their scrollable body so body padding cannot shift their horizontal placement;
- dynamic validation must not move the keypad or action card;
- shorter screens reclaim spacing before shrinking the action targets.

## Customer-form density

Customer entry follows the same layout-before-shrink principle:

- quick information: three columns on desktop/wide POS surfaces;
- additional information: **three real grid columns** on desktop/wide POS surfaces;
- narrow/mobile: one column for both groups;
- helper text that repeats an already-enforced obvious constraint should not consume vertical space in the normal entry path.

## Affected current POS surfaces

- basket header: unchanged;
- basket body: **مسح السلة** appears as the first special row when items exist, before normal product lines;
- basket footer: **حفظ / دفع** only as the stable two-slot operation card;
- Quick Sale empty-ticket footer: **سداد / دفع**;
- cash/card completion: **إلغاء الفاتورة / سداد أو تم الدفع**;
- sale success: **طباعة / بيع جديد**;
- customer creation additional information density.

Debt-book settlement remains its own operational dialog and follows D-021 for stable footer reachability; it is not used to redefine the sale-screen **سداد + دفع** relationship.

## Data consequence

The operation-card position, clear-cart presentation and column count are UI/interaction decisions and add no durable business fields.

`إلغاء الفاتورة` currently uses the prototype new-sale/reset path before payment completion. Production cancellation/audit semantics must be defined by the sale/checkout domain before this behavior is treated as a fiscal or accounting cancellation record.
