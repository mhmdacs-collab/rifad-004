# Rifad UI Authority Model

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

### 3. Rifad visual authority

Rifad's design system is the authority for:

- brand colors and tokens;
- typography;
- icons and original assets;
- spacing, radius, elevation and component styling;
- accessibility treatment;
- animation values;
- final responsive composition while preserving approved behavior.

The provisional executable baseline is stored in `RIFAD_DESIGN_TOKENS.json`. It is approved only for the first UI slice and must be promoted or changed through a visual decision before production design freeze. A developer must not invent a generic dashboard theme or unrecorded tokens to fill a gap.

### 4. Optional visual donors

Other products or open-source interfaces may be proposed as visual donors. They are not approved merely because they look better or are mentioned in discussion. Each adoption requires an explicit decision record that identifies the exact pattern, affected Rifad screens and evidence.

Examples such as Openfront or Toast are candidates only until reviewed. Observable proprietary behavior may be used as inspiration/specification, but protected code, assets, branding or distinctive trade dress must not be copied. Direct code reuse requires license and dependency verification.

## What visual improvement may change

With an approved visual decision, Rifad may improve:

- color, typography and icon treatment;
- spacing and component polish;
- information legibility and accessibility;
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

Changing any item above requires a product/architecture decision and a manifest update before implementation.

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
