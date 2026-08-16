# POS-FLOW-001 — Retail Cash Sale Vertical Slice

## Authorization

This is the first UI flow authorized for implementation. The machine-readable scope is in `../UI_EXECUTION_MANIFEST.json`; this document explains the execution order for humans and coding agents.

No other screen family or hidden feature is part of this slice.

## Evidence

- Loyverse research section 34: normal retail sale flow.
- Sections 4.2, 5, 6.1, 6.2 and 6.5: entry, sales, cash and success behavior.
- Sections 28 and 31: offline-visible and RTL behavior.
- Rifad visual authority and provisional tokens under `docs/ui/`.

## Implementation order

1. Create the React/TypeScript/Vite application shell and PWA baseline under `apps/pos`.
2. Create only the draft contracts named by the manifest actions.
3. Create one mock adapter per named contract family.
4. Implement `POS-SCREEN-001` for existing-account sign-in on an unlinked mock device.
5. Implement `POS-SCREEN-002` for four-digit employee PIN unlock.
6. Implement the permitted subset of `POS-SCREEN-003`: fixed-price catalog, search, empty/current ticket and quantity/delete controls.
7. Implement `POS-SCREEN-007` with Cash as the only active method in this slice.
8. Implement `POS-SCREEN-008` for exact/over/under cash tender.
9. Implement `POS-SCREEN-011` for completed sale, optional mock printing and New sale.
10. Add contract, interaction, visual, RTL, phone/tablet/Windows and restart tests named with the manifest IDs.

## Required component behavior

- Components may own focus, open/closed dialogs, pressed state and other presentation state.
- Ticket, money, checkout result, employee identity and print job state come from contracts/adapters.
- Amounts use the Rifad Money DTO; components do not calculate authoritative totals with floating-point numbers.
- The cash completion command has one stable identity and owns sale/payment completion atomically in the mock.
- Print failure and `delivery-unknown` are visible; automatic blind reprint is forbidden.

## Visual boundary

- Follow the product hierarchy and density evidenced by Loyverse research.
- Use `RIFAD_DESIGN_TOKENS.json` for this slice.
- Do not copy Loyverse branding or introduce an unapproved Openfront/Toast/other visual pattern.
- Phone is a separate catalog/ticket composition, not a compressed tablet split.

## Explicitly prohibited in this slice

- inventing undefined screens, dialogs, shortcuts or settings;
- implementing modifiers, variants, open price, customer, loyalty, discount, tables or open tickets;
- implementing a real payment terminal, database, sync, ZATCA or printer transport;
- adding donor application models to the UI;
- marking a mapped screen ready without completing its states/actions/contracts/evidence.

## Completion evidence

The slice may move from `ready` to `implemented` only when code paths reference all involved screen/action IDs and the flow can be completed end to end with mocks. It moves to `verified` only after the acceptance criteria in the manifest pass.
