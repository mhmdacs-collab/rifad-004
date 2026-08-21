# VISUAL-DECISION-009 — Front Office visual consolidation

Last updated: 2026-08-21
Status: **OWNER-AUTHORIZED IMPLEMENTATION DIRECTION / RUNTIME VISUAL ACCEPTANCE PENDING**

Current checkpoint: Wave 7 visual polish is halted at the owner-directed safe
checkpoint. Runtime Visual remains `UNVERIFIED` overall, and MAP-02 has not started.

## Decision

Rifad POS now has an explicit consolidation boundary for the cashier-facing Front Office.

The accepted direction is to stop extending the historical `visual-pass-*` sequence for ordinary Front Office polish. New work on the sale/catalog/basket/payment shell must converge on named Rifad-owned styles and stable component structure instead of creating `visual-pass-54`, `visual-pass-55`, and so on.

This decision does **not** authorize a risky one-shot deletion of historical CSS. Existing passes remain compatibility evidence until their affected states are covered by the consolidated layer and tests. Cleanup is incremental and must preserve already accepted behavior.

Rifad contracts and domain semantics remain authoritative. The consolidation is presentation/interaction work unless a separately approved product decision explicitly changes behavior.

## Affected surfaces and flows

Primary current scope:

- `POS-SCREEN-003` — Sales / cashier workspace.
- `POS-SCREEN-007` — configuration-driven payment selection.
- the current basket/ticket rail and transaction operation card used by the sales/payment flow.
- the restaurant/local-service subset already authorized under `POS-FLOW-002`.
- `POS-FLOW-007` delivery COD merchant collection only where the current manifest already marks it executable.

No new fiscal, settlement, synchronization, LAN or production persistence behavior is authorized by this visual decision.

## Final Front Office hierarchy

For desktop and landscape-tablet cashier use, the working composition is:

1. **Catalog workspace** — category/page navigation, search and large product touch targets.
2. **Transaction rail** — customer/ticket context, basket lines, totals and stable operation card.
3. **Checkout rail** — reuses the same physical transaction-rail width so the cashier's completion targets do not jump between sale, payment and success.

The interface should feel like an installed POS application, not a responsive marketing/admin website.

The visual language is deliberately calm:

- Rifad green owns primary action/selection states;
- white/light-neutral work surfaces;
- thin dividers before decorative shadows;
- Cairo-first Arabic readability;
- important totals remain glance-readable;
- large touch targets and clear pressed/disabled states;
- no decorative gradients or nested card stacks in the normal cashier path.

## Product-card rule

Touch product cards prioritize recognition and speed:

- product identity occupies the primary visual area;
- price remains immediately visible without opening a detail surface;
- cards preserve large whole-card hit targets;
- pressed feedback is visible and short;
- text selection/desktop-like accidental interaction must not compete with cashier tapping;
- responsive layouts change column count/spacing before important touch targets become too small.

Product images/colors remain governed by the catalog visual-identity decision; this record does not invent production media storage.

## Basket and line-edit rule

The transaction rail keeps the already accepted stable geometry from `VISUAL-DECISION-005`.

- **مسح السلة** remains a compact destructive basket utility and must not move the transaction operation card.
- A quantity decrement may not produce a quantity below `1`; deletion is a separate explicit destructive action.
- A line-edit Save action is disabled when no effective edit has occurred.
- Closing/cancelling a line-edit surface must not silently save.
- Where swipe-to-delete is implemented, the revealed destructive action is explicit and the ordinary tap target still opens editing.
- modal/sheet presentation must not treat an outside/backdrop tap as implicit Save.

These interaction refinements must be implemented through existing Rifad sale commands/contracts rather than direct UI mutation of durable data.

## Restaurant and kitchen-facing state rule

Restaurant wording is optional and follows the existing design authority:

- restaurant service OFF: do not ask retail/direct-sale cashiers about **محلي / سفري**;
- restaurant service ON: direct **دفع** is the immediate **سفري** path;
- **محلي** is the local-service alternative;
- advanced place/table behavior stays behind its own capability state.

For an already-open local order, sent lines are read-only to ordinary cart controls.
New additions live in a separate pending batch and may be edited or cleared without
changing sent history. The visible **إرسال** state gates payment until pending work
is sent successfully. A sent-line reduction/cancellation uses only the separate
owner-authorized correction path and appends a delta; it never rewrites the original
batch. This visual record does not fake kitchen transport or claim the later production
contract exists today.

## Payment rule

Payment selection remains configuration-driven and uses MAP-01 financial meaning:

- نقدي → direct impact `cash`;
- شبكة / مدى → direct impact `bank`;
- آجل → direct impact `customer-receivable`;
- merchant-defined methods keep their configured order/visibility and are not silently coerced into Cash/Card.

The cashier should recognize available methods quickly. Unsupported completion lifecycles remain visibly unavailable instead of pretending to complete through another method.

Delivery **channel/source is not a payment method**. The current COD flow may preserve, for example, `channel = HungerStation` together with merchant collection `cash`; this decision must not collapse those facts into one UI field or money meaning.

## Debt terminology

Cashier/customer debt surfaces use **الدين** as the visible business concept rather than ambiguous **الرصيد** wording when the value represents money owed by the customer.

Partial settlement and collection-method truth remain domain/payment lifecycle concerns. The UI must never allow an apparent settlement amount greater than the debt or fabricate a settlement receipt without the underlying command succeeding.

## Printing preference

The existing device-local **Always Print** preference remains a cashier/device preference. Visual consolidation may make the state clearer, but it does not convert the preference into cloud/synchronization architecture.

Direct-print/skip-success behavior may only be treated as complete where the existing print flow and tests prove it; this decision is not permission to fake successful hardware printing.

## Consolidation implementation rule

New Front Office styling uses a named consolidation layer, initially loaded **after** historical visual passes so it can establish the final shell without rewriting unrelated screens in one commit.

The first target file is:

- `apps/pos/src/front-office.css`

Rules:

1. do not add another numbered visual pass for this work;
2. prefer design tokens and stable semantic component classes;
3. do not change domain meaning through CSS/DOM observers;
4. migrate presentation-only historical hacks into React/semantic markup when touching the relevant component and when tests protect the move;
5. remove an old pass only after its behavior is covered by the consolidated implementation;
6. preserve responsive, RTL, keyboard-accessibility and touch evidence for affected IDs.

## Explicit exclusions

This decision does not claim completion of:

- MAP-02 shift/cash drawer/time clock;
- MAP-03 final sold tax/discount/pricing truth;
- MAP-04 full durable open-ticket lifecycle;
- MAP-05 normalized multi-payment/split/refund lifecycle;
- production kitchen/KDS transport;
- real Mada/card-terminal integration;
- production local database or synchronization;
- Back Office ↔ POS production transport;
- LAN/Branch Hub;
- delivery-platform settlement/reconciliation;
- ZATCA/fiscal implementation.

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA` remains binding.

## Acceptance

Implementation may proceed on the isolated Front Office branch. Runtime visual acceptance remains a separate owner review after the first consolidated shell is rendered at desktop, 1366×768, landscape tablet, short-height POS and narrow/mobile breakpoints.
