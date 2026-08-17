# VISUAL-DECISION-005 — Transaction Operation Card Continuity

Status: **current owner-directed POS interaction rule; final visual review pending**

Date: 2026-08-17

## Decision

Rifad POS minimizes cashier finger travel by keeping the **same two-slot operation card** in the same lower transaction zone as the sale advances.

The important rule is not to move whichever action happens to be called "سداد" into a different slot. The rule is to preserve the physical card and the meaning of its two positions.

For the current RTL POS composition:

- the right slot is the secondary / alternative / cancel slot;
- the left slot is the main transaction-completion slot;
- the card remains visually and spatially stable across the sale, payment and success stages.

Current intended sequence:

- normal sale: **حفظ | دفع**;
- Quick Sale empty ticket: **سداد | دفع** (Pay remains visible but disabled until a sale exists);
- cash checkout: **إلغاء الفاتورة | سداد**;
- card/mock checkout: **إلغاء الفاتورة | تم الدفع**;
- completed sale: **طباعة | بيع جديد**.

`إلغاء الفاتورة` is intentionally red but calm, because it abandons the unpaid transaction and starts a fresh sale without creating a receipt.

## Why this is different from the previous interpretation

The previous pass incorrectly moved Quick Sale debt **سداد** into the Pay slot and hid the disabled Pay control. That changed the established sale-footer relationship instead of preserving it.

The corrected rule preserves **سداد + دفع** on the sale screen and applies continuity to the operation card itself as the transaction progresses.

## Scroll relationship

This decision extends D-021:

- repeated content and optional fields absorb scrolling first;
- the transaction operation card stays outside or at the stable edge of scrolling content;
- dynamic validation must not move the keypad or action card;
- shorter screens reclaim spacing before shrinking the action targets.

## Customer-form density

Customer entry follows the same layout-before-shrink principle:

- quick information: three columns on desktop/wide POS surfaces;
- additional information: **three real grid columns** on desktop/wide POS surfaces;
- narrow/mobile: one column for both groups;
- helper text that repeats an already-enforced obvious constraint should not consume vertical space in the normal entry path.

## Affected current POS surfaces

- basket footer: **حفظ / دفع**;
- Quick Sale empty-ticket footer: **سداد / دفع**;
- cash/card completion: **إلغاء الفاتورة / سداد أو تم الدفع**;
- sale success: **طباعة / بيع جديد**;
- customer creation additional information density.

Debt-book settlement remains its own operational dialog and follows D-021 for stable footer reachability; it is not used to redefine the sale-screen **سداد + دفع** relationship.

## Data consequence

The operation-card position and column count are UI-only layout decisions.

`إلغاء الفاتورة` currently uses the prototype new-sale/reset path before payment completion. Production cancellation/audit semantics must be defined by the sale/checkout domain before this behavior is treated as a fiscal or accounting cancellation record.
