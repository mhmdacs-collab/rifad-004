# Approved and Current Visual Decisions

Last updated: 2026-08-17

Approved/current records:

- `VISUAL-DECISION-001-RIFAD-BRAND-PALETTE.md` — official Rifad green palette and logo variants.
- `VISUAL-DECISION-002-LOYVERSE-SALES-STRUCTURE.md` — independently implemented Loyverse sales hierarchy under Rifad branding; original `Save` semantics are bounded to the early slice and do not own future restaurant-service behavior.
- `VISUAL-DECISION-003-TOUCH-FIRST-HUMAN-SCALE.md` — binding cashier rule: touch first, then human visual clarity, then beauty; layout changes before important touch targets shrink.
- `VISUAL-DECISION-004-INLINE-CHECKOUT-PAYMENT-RECOGNITION.md` — basket-rail checkout, strong visual payment-method recognition, success hierarchy and explicit mock-card versus real-terminal boundary.
- `VISUAL-DECISION-005-PRIMARY-ACTION-SPATIAL-CONTINUITY.md` — stable transaction-operation geometry, Clear Cart placement/minimal copy and zero-jump shared rail width.
- `VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md` — owner-directed restaurant service with separate simple/advanced place modes plus unified online-order interaction; market-researched, **implementation/manifest authorization still pending**.

Loyverse remains the primary functional baseline, but Rifad may adopt a narrower proven pattern from another product after explicit research/decision. No donor owns the complete Rifad interface.

Use one Markdown file per decision:

```text
VISUAL-DECISION-###-short-name.md
```

Each file must contain the fields required by `../DESIGN_AUTHORITY.md` and identify affected screens/flows when stable IDs exist. Approval may cover a narrow pattern; it never grants blanket permission to copy a whole interface.

For canonical POS wording and durable traceability, update `../POS_UI_NAMING_AND_FIELD_REGISTER.md` whenever a visual/product change introduces a field, setting, status, fulfillment/channel/payment fact, integration mapping or other durable meaning.
