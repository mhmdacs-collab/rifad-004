# POS-FLOW-001 — Retail Cash Sale Vertical Slice

Last updated: 2026-08-17

## Authorization

This is the first UI flow authorized for implementation. Machine-readable scope is in `../UI_EXECUTION_MANIFEST.json`.

The original authorization remains a **cash-sale** slice. A later owner-directed mock **شبكة / مدى** UX extension exists on the active visual branch; it is not production terminal support and does not silently redefine POS-FLOW-001.

The newer restaurant-service/place/channel/online-order direction is documented separately and **does not expand this manifest authorization**.

## Evidence

- Loyverse research section 34: normal retail sale flow.
- Sections 4.2, 5, 6.1, 6.2 and 6.5: entry, sales, cash and success behavior.
- Sections 28 and 31: offline-visible and RTL behavior.
- Rifad visual authority and POS naming/field register under `docs/ui/`.

## Implementation order for the authorized cash slice

1. React/TypeScript/Vite shell + PWA baseline.
2. Only draft contracts named by manifest actions.
3. One mock adapter per named contract family.
4. `POS-SCREEN-001` mock existing-account sign-in.
5. `POS-SCREEN-002` four-digit employee PIN.
6. permitted `POS-SCREEN-003`: fixed-price catalog/search/current ticket/quantity/delete.
7. `POS-SCREEN-007` Cash as authorized payment method.
8. `POS-SCREEN-008` exact/over/under cash tender.
9. `POS-SCREEN-011` success, optional mock printing and New sale.
10. manifest-linked interaction/visual/RTL/device/restart tests.

## Required component behavior

- components own only presentation state such as focus/dialog/pressed state;
- ticket/money/checkout/employee/print facts come from contracts/adapters;
- authoritative money uses Rifad Money DTO, not floating-point view calculations;
- cash completion owns one stable command identity and atomic mock completion;
- print failure and `delivery-unknown` are visible; blind automatic reprint is forbidden;
- canonical labels/data gaps are maintained in `../POS_UI_NAMING_AND_FIELD_REGISTER.md`.

## Current accepted visual direction

The active branch retains the authorized business steps but presents checkout inline:

`basket → payment methods → cash → success`

Catalog remains visible as frozen context.

Design priority:

> **Touch first, then human visual clarity, then beauty.**

Responsive work changes layout before shrinking important touch controls.

## Restaurant evolution boundary

The early sale shell exposed generic **حفظ** because restaurant/open-order semantics were outside the original slice.

Current product direction now has two separate configuration layers:

### Restaurant service OFF

- retail/direct POS;
- no forced **محلي / سفري** terminology;
- **دفع** is ordinary checkout.

### Restaurant service ON

- direct **دفع** defaults operationally to **سفري**;
- **محلي** is the alternate local path.

Then place management may be independently OFF or ON:

- OFF: **محلي** proceeds to local checkout without table/room/session selection;
- ON: **محلي** opens area/place selection, sends kitchen work, clears working basket and keeps an open local order.

Delivery **توصيل** is generally established by delivery-channel/order workflow, not a mandatory selector on every sale.

See:

- `../../research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`;
- `../visual-decisions/VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md`.

None of this is authorized by POS-FLOW-001. A new bounded manifest flow must define actions/states/contracts/persistence before restaurant implementation starts.

## Delivery/online-order evolution boundary

Official research now confirms that some delivery platforms expose partner APIs and that established restaurant systems can receive online orders directly into the POS, auto-accept/send to kitchen, and distinguish prepaid orders from cash/card due on delivery/pickup.

See:

- `../../research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`.

Target Rifad principle:

> **One online-order cashier experience, many adapters behind it.**

Adapters may be direct platform adapters or aggregator-backed adapters behind one Rifad capability contract.

An API-connected order must not require the cashier to reselect the platform or retype the order. A manual platform tile is only a fallback/unconnected path.

This is also **not authorized by POS-FLOW-001**. It requires its own manifest/contract scope, including external-order identity, payment/collection state, pricing, webhook idempotency, kitchen routing and settlement/reconciliation boundaries.

## Current card / شبكة / مدى branch extension

The active branch contains a Rifad mock card path that can select **شبكة / مدى**, show confirmation, complete a mock transaction, persist `paymentMethod: "card"` and reach sale success.

This validates UX/data shape only. It is not evidence of terminal/provider connectivity, authorization/decline transport, RRN/approval reference, settlement/reconciliation, refunds or production payment-security certification.

Before promotion beyond UX validation, manifest scope must be reconciled explicitly.

## Visual boundary

- follow Rifad hierarchy/ergonomic evidence;
- follow `DESIGN_AUTHORITY.md`;
- use Rifad visual identity, never donor branding/assets;
- phone may use separate composition rather than compressed desktop split;
- payment-method recognition may use strong original cues while preserving text contrast/touch clarity.

## Original explicit non-goals of POS-FLOW-001

- sign-up/email confirmation;
- time clock/manager override;
- modifiers/variants/open-price;
- real payment terminal/database/sync/ZATCA/printer transport;
- split payment;
- production integrated card;
- restaurant-service semantics, place management/open-order lifecycle;
- production delivery-platform/aggregator integration;
- donor application models as Rifad UI authority.

Later customer/loyalty/debt/product experiments on the active branch do not retroactively expand the original authorization. Current status lives in `../UI_PROGRESS.md`.

## Completion evidence

The original cash slice is behavior-implemented when its code paths reference authorized screen/action IDs and complete end to end through Rifad mock contracts. Production verification remains separate from visual prototype success.

For any new visible durable field exposed during later work, update `../POS_UI_NAMING_AND_FIELD_REGISTER.md` before database freeze.
