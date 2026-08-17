# VISUAL-DECISION-004 — Inline Basket Checkout and Payment Recognition

## Status

Approved current POS interaction direction on 2026-08-17. Payment-terminal production integration is explicitly not part of this visual approval.

## Decision

Checkout preserves cashier spatial context instead of replacing the sales surface with unrelated full-page screens.

The basket rail transforms through:

`basket → payment methods → cash/card → success`

The product catalog remains visible as frozen context while checkout is active.

## Payment-method recognition

Payment methods are large touch cards and should be recognizable before the cashier finishes reading the label.

Current approved direction:

- **نقدًا** uses a strong cash/money visual cue plus clear text;
- **شبكة / مدى** uses a strong card/Mada/contactless visual cue plus clear text;
- method art may be strong inside a contained visual block;
- any large background artwork must remain subdued enough that text contrast and touch-state clarity win;
- payment cards remain full-width rows while the method count is small; multi-column layout is acceptable only when more methods make it useful;
- visual artwork is UI presentation, not durable transaction data.

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

## Verification

- cash flow remains behavior-tested;
- mock card flow records `paymentMethod: "card"` and reaches success;
- final visual acceptance is based on human glance recognition and touch reachability, not icon novelty alone.
