# VISUAL-DECISION-004 — Inline Basket Checkout and Payment Recognition

## Status

Approved current POS interaction direction on 2026-08-17 and refined by owner review on 2026-08-20. Payment-terminal production integration is explicitly not part of this visual approval.

## Decision

Checkout preserves cashier spatial context instead of replacing the sales surface with unrelated full-page screens.

The basket rail transforms through:

`basket → payment methods → cash/card/credit → success`

The product catalog remains visible as frozen context while checkout is active.

## Payment-method recognition

Payment methods are large touch cards and should be recognizable before the cashier finishes reading the label.

Current approved direction:

- each payment card uses a strong visual/icon block plus **Arabic primary name and concise English secondary name**;
- payment cards do **not** carry a permanent explanatory description under the method name; operational warnings/statuses may use separate state treatment when required;
- **نقدًا / Cash** uses a strong cash/money visual cue;
- **شبكة / مدى / Card** uses a strong card/Mada/contactless visual cue;
- **آجل / Credit** uses a customer/account visual cue;
- delivery remains one hub rather than expanding every delivery application into the payment-method list; application identities/logos belong inside the delivery-channel selection surface;
- payment methods remain **one full-width column** for touch clarity; when the configured list exceeds available vertical space, the method list scrolls instead of shrinking cards or switching to dense multi-column payment tiles;
- method art may be strong inside a contained visual block;
- any large background artwork must remain subdued enough that text contrast and touch-state clarity win;
- visual artwork and English display helpers are UI presentation, not durable transaction/payment authority.

## Success hierarchy

- cash **الباقي** is a hero result;
- **بيع جديد** is the dominant next action;
- Print remains available but secondary;
- success facts use the available rail height instead of appearing as a small desktop summary floating in empty space.

## Card mock boundary

The active branch includes a testable mock `card` / **شبكة / مدى** path for UX validation.

This decision does not claim:

- real Mada terminal integration;
- provider/acquirer connectivity;
- authorization/decline transport;
- reconciliation;
- production refund support;
- payment certification/security completion.

Those require separate product/architecture/manifest evidence and real adapter proof.

## Affected IDs

- `POS-SCREEN-007`
- `POS-SCREEN-008`
- `POS-SCREEN-009` as current mock UX experiment only
- `POS-SCREEN-011`
- `POS-FLOW-001` presentation for the cash path
- `POS-FLOW-007` presentation for delivery COD merchant collection

## Verification

- cash flow remains behavior-tested;
- mock card flow records `paymentMethod: "card"` and reaches success;
- payment selection tests prove Arabic + English labels, no permanent description text, one-column method ordering and scroll-list behavior for larger configured sets;
- final visual acceptance is based on human glance recognition and touch reachability, not icon novelty alone.
