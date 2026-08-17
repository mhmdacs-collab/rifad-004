# Rifad UI Authority Model

Last updated: 2026-08-17

## Purpose

Rifad separates product/workflow evidence from visual design authority. This lets the product learn from proven interfaces without copying another product blindly or allowing visual inspiration to change business behavior.

## Authority order

### 1. Rifad product decisions

`PROJECT_RULES.md`, current architecture decisions and approved product requirements are the final authority when any source conflicts.

### 2. Loyverse functional/workflow reference

The research under `docs/research/loyverse/` is the primary evidence for:

- screen and workflow inventory;
- navigation and information hierarchy;
- visible actions and their meaning;
- state transitions;
- permissions and prerequisite settings;
- offline-visible behavior;
- POS/KDS/CDS operational relationships;
- density and ergonomic baseline.

Loyverse is not a code dependency and does not own Rifad's identity, contracts or data model.

### 3. Rifad visual and interaction authority

Rifad's design system is the authority for:

- brand colors and tokens;
- typography;
- icons and original assets;
- spacing, radius, elevation and component styling;
- touch-target geometry and cashier ergonomics;
- accessibility treatment;
- animation values;
- final responsive composition while preserving approved behavior.

The provisional executable baseline is stored in `RIFAD_DESIGN_TOKENS.json`. It is approved only for the current UI work and must be promoted or changed through a visual decision before production design freeze. A developer must not invent a generic dashboard theme or unrecorded tokens to fill a gap.

### 4. Optional visual donors

Other products or open-source interfaces may be proposed as visual donors. They are not approved merely because they look better or are mentioned in discussion. Each adoption requires an explicit decision record that identifies the exact pattern, affected Rifad screens and evidence.

Examples such as Openfront or Toast are candidates only until reviewed. Observable proprietary behavior may be used as inspiration/specification, but protected code, assets, branding or distinctive trade dress must not be copied. Direct code reuse requires license and dependency verification.

---

# Human-first interaction rule

The current binding POS design priority is:

> **Touch first, then human visual clarity, then beauty.**

This is not a slogan; it is an implementation rule.

## Touch first

- Frequent cashier actions should normally provide about 48 px or more of usable hit area when the display allows it.
- On short-height devices, important controls should remain around 44–48 px rather than collapsing into desktop-sized buttons.
- The visual icon may remain smaller than its hit area.
- Whole rows/cards should be tappable when the entire row/card represents one action.
- Primary actions such as Pay, Complete payment and New sale receive more touch/visual weight than secondary actions such as Save or Print.
- If space becomes constrained, alter layout, column count, wrapping, scrolling, or secondary information before shrinking the main touch targets.

## Human visual clarity second

- Judge type size and contrast from a cashier's normal standing/seated viewing distance, not from a design-tool zoom level.
- Important money values must be readable at a glance.
- The next required action must be visually obvious without reading every helper sentence.
- Payment methods should use both text and strong visual recognition, not tiny icons or text-only rows when a better visual cue is available.
- Whitespace is useful only when it helps scanning and reachability; it must not make important information look undersized or lost.

## Beauty third

Polish is important, but decorative density, symmetry, subtlety, or visual novelty may not reduce touch reliability or glance readability.

---

# Responsive rule

Rifad POS is not designed for one screenshot size.

Every important visual pass must consider at least:

1. large cashier/desktop POS display;
2. 1366×768-class device;
3. tablet landscape;
4. short-height POS display;
5. mobile/narrow composition.

When the viewport changes, **layout may change before touch size changes**.

Phone is allowed to use a different composition from tablet/desktop. Do not compress a split-screen desktop/tablet surface into unusably small columns merely to preserve geometry.

---

# Current accepted POS interaction direction

The active POS branch has established these interaction decisions:

- product tiles are large touch targets;
- the product card is the primary source for unit price while basket rows emphasize quantity × item and row total;
- repeated item addition should emphasize quantity feedback rather than animate the whole basket row unnecessarily;
- checkout does not navigate away from the sale context; the basket rail transforms through payment stages while the product catalog remains visible as frozen context;
- checkout progression is conceptually `basket → payment methods → cash/card → success`;
- success emphasizes the result the cashier needs next, especially cash change, and makes **بيع جديد** the dominant next action;
- payment-method cards use strong visual recognition in addition to their Arabic labels;
- card/شبكة/مدى UX may be mocked for product validation, but production terminal support is not claimed until the terminal/provider adapter is proven.

Canonical cashier-facing labels and UI-to-data fields are maintained in `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

---

## What visual improvement may change

With an approved visual decision, Rifad may improve:

- color, typography and icon treatment;
- spacing and component polish;
- information legibility and accessibility;
- touch-target geometry;
- responsive composition;
- feedback animation and transition quality;
- empty/loading/error presentation.

## What visual improvement may not change silently

Visual work may not silently change:

- workflow steps or action meaning;
- contract calls or durable state transitions;
- permissions and authorization prompts;
- offline availability or synchronization semantics;
- fiscal, money or payment behavior;
- KDS/CDS operational propagation;
- required information or audit evidence.

Changing any item above requires a product/architecture decision and, where applicable, a manifest update before the behavior is considered production-approved.

## Visual reference decision record

Create one record per adopted pattern under `docs/ui/visual-decisions/` with:

- decision ID and status;
- source product/repository and exact URL/version/date inspected;
- affected screen/flow IDs;
- pattern being adopted;
- functional behavior that must remain unchanged;
- reuse mode: inspiration / behavioral reference / direct licensed reuse;
- license, asset and attribution review where applicable;
- RTL, accessibility and device-size consequences;
- screenshots/test fixtures used as acceptance evidence;
- approver and decision date.

## Implementation rule

The UI Execution Manifest names the required behavior. The Rifad design system decides its final appearance. An approved visual donor may influence styling only within that boundary.

For every new visible POS field or label, also update `POS_UI_NAMING_AND_FIELD_REGISTER.md` so later database work cannot forget UI-required data.
