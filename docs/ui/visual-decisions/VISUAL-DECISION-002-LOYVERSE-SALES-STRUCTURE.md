# VISUAL-DECISION-002 — Loyverse Sales Structure with Rifad Identity

## Status

Approved for the original `POS-FLOW-001` / `POS-FLOW-006` sales-shell structure. The early `Save` meaning is **not** the authority for the newer restaurant local/open-order direction.

## Evidence inspected

- Rifad's local Loyverse functional analysis, especially sections `5.1` through `5.6`.
- Official Loyverse help material for arranging the tablet sale screen, items and categories, making sales, smartphone favorites and sale-screen layouts.
- User-supplied Loyverse tablet screenshot inspected on 2026-08-16.

## Decision

- Loyverse is the functional and interaction oracle for the original slice, not a code or asset donor.
- On tablet and Windows, the physical layout keeps the ticket on the left and the catalog on the right for Arabic RTL use.
- The catalog owns a green top app bar, a fixed product grid and persistent sale-page tabs at the bottom.
- Product tiles are operational cells rather than ecommerce cards: centered name, category color and no decorative price treatment.
- Custom pages use twenty fixed slots. Creating a page enters edit mode; an empty slot opens a product picker; a placed product can be removed.
- The ticket owns its own header, simple line rows, tax/total block and bottom two-slot operation card.
- In the original slice that card contained Save/Charge semantics. Current restaurant research explicitly allows **محلي** to replace generic **حفظ** when optional table/local service is enabled; see `VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md`.
- Phone layout remains a separate application surface and does not squeeze the tablet split into a narrow viewport.
- Rifad green `#0A714E`, Rifad typography and Rifad-owned components/contracts remain authoritative.

## Explicit boundary

- No Loyverse source code, icons, logo or proprietary visual assets are copied.
- Categories and discounts in custom page slots are visible future capabilities but are disabled in the original slice.
- Loyverse open-ticket/table naming remains useful evidence, but Rifad is not required to keep a generic Save-first restaurant flow when a more direct local/place workflow is approved.
- Any future visual donor requires a separate approved/current decision and may not change workflow implicitly.

## Affected IDs

- `POS-FLOW-001`.
- `POS-FLOW-006`.
- `POS-SCREEN-003`.
- `POS-SCREEN-026`.

Future restaurant/open-order screen IDs are not authorized by this file and require manifest reconciliation.

## Verification

- Desktop reference width: ticket/catalog hierarchy, bottom page navigation and action placement.
- Phone width: no horizontal overflow and separate ticket access.
- Interaction: add item, edit line, create page, place product, persist local layout and complete a cash sale.
