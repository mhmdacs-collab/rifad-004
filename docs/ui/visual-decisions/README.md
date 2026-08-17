# Approved and Current Visual Decisions

Last updated: 2026-08-17

Approved/current records:

- `VISUAL-DECISION-001-RIFAD-BRAND-PALETTE.md` — official Rifad green palette and logo variants.
- `VISUAL-DECISION-002-LOYVERSE-SALES-STRUCTURE.md` — independently implemented Loyverse sales hierarchy under Rifad branding; original `Save` semantics are bounded to the early slice and do not own restaurant service behavior.
- `VISUAL-DECISION-003-TOUCH-FIRST-HUMAN-SCALE.md` — binding cashier rule: touch first, then human visual clarity, then beauty; layout changes before important touch targets shrink.
- `VISUAL-DECISION-004-INLINE-CHECKOUT-PAYMENT-RECOGNITION.md` — basket-rail checkout, payment recognition, success hierarchy and the boundary between mock card UX and real terminal support.
- `VISUAL-DECISION-005-PRIMARY-ACTION-SPATIAL-CONTINUITY.md` — stable transaction operation-card geometry, Clear Cart placement and zero-jump rail width.
- `VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md` — restaurant service/simple-local/advanced-place/online-order direction. The `POS-FLOW-002` local-service mock subset is now executable and behavior-tested; **owner visual acceptance is still pending**. Real kitchen transport, production restaurant persistence and online-order integration remain separate gaps.

Loyverse remains the primary functional baseline, but Rifad may adopt a narrower proven pattern from another product after explicit evidence/decision. No donor owns the complete Rifad interface.

Use one Markdown file per decision:

```text
VISUAL-DECISION-###-short-name.md
```

Each record must contain the fields required by `../DESIGN_AUTHORITY.md` and name affected screen/flow IDs when available. Approval may cover a narrow pattern; it never grants blanket permission to copy an interface.

For canonical wording and durable UI-field traceability, update `../POS_UI_NAMING_AND_FIELD_REGISTER.md` whenever product/UI work introduces a new visible field, option, status or payment fact.
