# Approved and Current Visual Decisions

Last updated: 2026-08-17

Approved/current records:

- `VISUAL-DECISION-001-RIFAD-BRAND-PALETTE.md` — official Rifad green palette and logo variants.
- `VISUAL-DECISION-002-LOYVERSE-SALES-STRUCTURE.md` — independently implemented Loyverse sales hierarchy under Rifad branding; original `Save` semantics are bounded to the early slice and do not own future restaurant service behavior.
- `VISUAL-DECISION-003-TOUCH-FIRST-HUMAN-SCALE.md` — binding cashier rule: touch first, then human visual clarity, then beauty; layout changes before important touch targets shrink.
- `VISUAL-DECISION-004-INLINE-CHECKOUT-PAYMENT-RECOGNITION.md` — basket-rail checkout, strong visual payment-method recognition, success hierarchy, and the explicit boundary between mock card UX and real terminal support.
- `VISUAL-DECISION-005-PRIMARY-ACTION-SPATIAL-CONTINUITY.md` — stable transaction operation-card geometry, clear-cart placement and zero-jump rail width.
- `VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md` — market-researched owner-directed restaurant/local/open-order direction; **implementation/manifest authorization is still pending**.

Loyverse remains the primary functional baseline, but Rifad may adopt a narrower proven pattern from another product after it is explicitly recorded. No donor owns the complete Rifad interface.

Use one Markdown file per decision:

```text
VISUAL-DECISION-###-short-name.md
```

Each file must contain the fields required by `../DESIGN_AUTHORITY.md` and must name the affected screen/flow IDs when those IDs exist. Approval may cover a narrow pattern; it never grants blanket permission to copy a whole interface.

For canonical POS wording and durable UI-field traceability, also update `../POS_UI_NAMING_AND_FIELD_REGISTER.md` whenever a visual/product change introduces a new visible field, option, status or payment fact.
