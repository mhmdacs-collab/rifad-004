# Approved and Current Visual Decisions

Last updated: 2026-08-18

Approved/current records:

- `VISUAL-DECISION-001-RIFAD-BRAND-PALETTE.md` — official Rifad green palette and logo variants.
- `VISUAL-DECISION-002-LOYVERSE-SALES-STRUCTURE.md` — independently implemented Loyverse sales hierarchy under Rifad branding; original `Save` semantics are bounded to the early slice and do not own restaurant service behavior.
- `VISUAL-DECISION-003-TOUCH-FIRST-HUMAN-SCALE.md` — binding cashier rule: touch first, then human visual clarity, then beauty; layout changes before important touch targets shrink.
- `VISUAL-DECISION-004-INLINE-CHECKOUT-PAYMENT-RECOGNITION.md` — basket-rail checkout, payment recognition, success hierarchy and the boundary between mock card UX and real terminal support.
- `VISUAL-DECISION-005-PRIMARY-ACTION-SPATIAL-CONTINUITY.md` — stable transaction operation-card geometry, Clear Cart placement and zero-jump rail width.
- `VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md` — restaurant service/simple-local/advanced-place/online-order direction. The `POS-FLOW-002` local-service mock subset is executable and behavior-tested; real kitchen transport, production restaurant persistence and online-order integration remain separate gaps.
- `VISUAL-DECISION-007-BACK-OFFICE-LOYVERSE-HIERARCHY.md` — owner-approved Back Office structural reference based on supplied Loyverse screenshots. Current direction emphasizes calm hierarchy, Cairo-first readability, Rifad color identity, flat/light management surfaces, one completion area, minimal effects and protection against polish layers changing shell geometry. Final visual acceptance is still pending runtime review.

Additional current catalog-visual decision:

- `../VISUAL-DECISION-008-CATALOG-VISUAL-IDENTITY.md` — item image/color/shape plus category/option-group/add-on-group accent colors as Rifad catalog semantics; browser Data URL/media handling remains staging transport, not production media architecture.

Current detailed Loyverse Back Office evidence/observations are preserved in:

- `../../research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md`.

Loyverse remains the primary functional baseline, but Rifad may adopt a narrower proven pattern from another product after explicit evidence/decision. No donor owns the complete Rifad interface.

Use one Markdown file per decision:

```text
VISUAL-DECISION-###-short-name.md
```

Each record must contain the fields required by `../DESIGN_AUTHORITY.md` and name affected screen/flow IDs when available. Approval may cover a narrow pattern; it never grants blanket permission to copy an interface.

For canonical wording and durable UI-field traceability, update `../POS_UI_NAMING_AND_FIELD_REGISTER.md` whenever product/UI work introduces a new visible field, option, status or payment fact.
