# POS-FLOW-001 — Retail Cash Sale Vertical Slice

Last updated: 2026-08-17

## Authorization

This is the first UI flow authorized for implementation. The machine-readable scope is in `../UI_EXECUTION_MANIFEST.json`; this document explains the execution order for humans and coding agents.

The original authorization remains a **cash-sale** slice. A later owner-directed mock **شبكة / مدى** UX extension now exists on the active visual branch; that extension is documented below and must not be confused with production terminal support or silently redefine POS-FLOW-001.

## Evidence

- Loyverse research section 34: normal retail sale flow.
- Sections 4.2, 5, 6.1, 6.2 and 6.5: entry, sales, cash and success behavior.
- Sections 28 and 31: offline-visible and RTL behavior.
- Rifad visual authority and current POS field/naming register under `docs/ui/`.

## Implementation order for the authorized cash slice

1. Create the React/TypeScript/Vite application shell and PWA baseline under `apps/pos`.
2. Create only the draft contracts named by the manifest actions.
3. Create one mock adapter per named contract family.
4. Implement `POS-SCREEN-001` for existing-account sign-in on an unlinked mock device.
5. Implement `POS-SCREEN-002` for four-digit employee PIN unlock.
6. Implement the permitted subset of `POS-SCREEN-003`: fixed-price catalog, search, empty/current ticket and quantity/delete controls.
7. Implement `POS-SCREEN-007` with Cash as the authorized payment method in this slice.
8. Implement `POS-SCREEN-008` for exact/over/under cash tender.
9. Implement `POS-SCREEN-011` for completed sale, optional mock printing and New sale.
10. Add contract, interaction, visual, RTL, phone/tablet/Windows and restart tests named with the manifest IDs.

## Required component behavior

- Components may own focus, open/closed dialogs, pressed state and other presentation state.
- Ticket, money, checkout result, employee identity and print job state come from contracts/adapters.
- Amounts use the Rifad Money DTO; components do not calculate authoritative totals with floating-point numbers.
- The cash completion command has one stable identity and owns sale/payment completion atomically in the mock.
- Print failure and `delivery-unknown` are visible; automatic blind reprint is forbidden.
- Canonical cashier-facing labels and UI-to-data gaps are maintained in `../POS_UI_NAMING_AND_FIELD_REGISTER.md`.

## Current accepted visual/interaction direction

The current branch retains the authorized business steps but presents checkout inline in the basket rail:

`basket → payment methods → cash → success`

The product catalog remains visible as frozen spatial context during checkout.

The POS design priority is:

> **Touch first, then human visual clarity, then beauty.**

Responsive work changes layout before shrinking important touch controls.

## Current card / شبكة / مدى branch extension

After the original cash flow was implemented, the owner requested that **شبكة / مدى** be visually active and testable rather than shown as unavailable.

The active branch therefore contains a Rifad mock card path that can:

- select `card` / **شبكة / مدى**;
- show a card-payment confirmation surface;
- complete a mock card transaction;
- persist a receipt with `paymentMethod: "card"`;
- reach sale success.

This extension exists to validate UX and data shape.

It is **not** evidence of:

- a real Mada terminal/provider adapter;
- acquiring-bank connectivity;
- production authorization/decline transport;
- reconciliation or settlement;
- card refund;
- production payment security/certification.

The binding manifest still maps integrated payment separately. Before the card path is promoted beyond branch-level UX validation, manifest scope must be reconciled explicitly.

## Visual boundary

- Follow the product hierarchy and ergonomic evidence from Rifad research.
- Follow `DESIGN_AUTHORITY.md`, including the touch-first human-scale rule.
- Use Rifad visual identity; do not copy donor branding/assets.
- Phone may use a separate catalog/ticket composition rather than a compressed tablet split.
- Payment-method recognition may use strong original visual cues as long as text contrast and touch clarity remain primary.

## Original explicit non-goals of POS-FLOW-001

- sign-up/email confirmation;
- time clock and manager override;
- modifiers, variants and open-price workflow;
- real payment terminal, database, sync, ZATCA or printer transport;
- split payment;
- production integrated-card support;
- donor application models as Rifad UI authority.

Some customer/loyalty/debt/product experiments have subsequently been implemented on the active UI branch. Their presence does not retroactively expand the original POS-FLOW-001 authorization; current status is recorded in `../UI_PROGRESS.md`.

## Completion evidence

The original cash slice is behavior-implemented when code paths reference its screen/action IDs and the flow completes end to end through Rifad mock contracts. Production verification remains separate from visual prototype success.

For any new visible durable field exposed during later UI work, update `../POS_UI_NAMING_AND_FIELD_REGISTER.md` before database freeze.
