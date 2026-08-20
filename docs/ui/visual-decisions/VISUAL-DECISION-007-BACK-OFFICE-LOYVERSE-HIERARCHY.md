# VISUAL-DECISION-007 — Back Office Loyverse-like hierarchy

Last updated: 2026-08-18
Status: **VISUAL REFERENCE / SHELL LOCKED BY OWNER**

## Decision

The owner has explicitly closed the general Back Office visual-design phase for the current product cycle.

Loyverse remains the direct structural/interaction reference for the management shell and catalog-administration surfaces. The purpose of the lock is to stop alternating between redesign and feature invention: Rifad now keeps this visual language stable while synchronization and product capabilities are developed.

This is a **reference/shell lock**, not a claim that every future screen is pixel-frozen forever. New feature-specific controls may be added where required, but they must inherit the locked hierarchy instead of reopening general layout/styling work.

Rifad continues to own all contracts, data meanings, adapters, persistence boundaries, implementation code and brand identity.

## Locked visual characteristics

The Back Office must keep the following baseline unless the owner explicitly reopens visual design:

- full-width application bar using Rifad primary green `#0A714E`;
- persistent RTL navigation rail on the right;
- compact administration navigation density;
- pale gray workspace with focused white management surfaces;
- thin borders and restrained/no shadows where separation is already clear;
- no decorative gradients in ordinary management surfaces;
- Cairo-first Arabic typography with practical offline Windows/browser fallbacks;
- comfortably readable list/form text at normal 1920×1080 viewing distance;
- consistent simple line pictograms for common actions where useful;
- calm, obvious hover/focus/selected states;
- tables optimized for scanning speed;
- focused vertical item editing instead of dashboard-style composition;
- one clear Save/Cancel completion area per form;
- compact practical product/POS representation controls;
- category, option-group and add-on editing presented as direct merchant forms, not technical builders;
- Rifad identity expressed through brand color, typography, action treatment and interaction feedback without changing the accepted hierarchy.

## Locked workflow rule

For this visual family the sequence is now:

`Loyverse reference → reproduce closely → visual shell lock → build Rifad capabilities on top`

Do **not** return to:

`visual tweak → feature → redesign → feature → redesign`

General visual changes now require one of:

1. an explicit owner request to reopen the visual layer;
2. a concrete usability/responsive/accessibility defect;
3. a new feature whose required interaction cannot fit the locked hierarchy without a bounded adjustment.

A feature request by itself is not permission to redesign unrelated surfaces.

## Visual anti-patterns already rejected

Do not reintroduce:

1. giant page headings inside ordinary admin forms;
2. large decorative empty margins around unnecessarily narrow editors;
3. nested card-inside-card-inside-panel structures;
4. gradients/heavy shadows used to simulate modernity;
5. oversized product preview blocks;
6. excessive bold text;
7. repeated primary actions competing for attention;
8. CSS polish layers changing topbar/sidebar/workspace geometry;
9. tiny Arabic typography copied from legacy enterprise UI;
10. decoration where spacing, typography or a divider communicates hierarchy better.

## Merchant-simplicity refinement retained

The locked presentation keeps the Rifad-native merchant model:

- **مجموعات الخيارات** as reusable groups;
- **أسعار متعددة** as one clear item-level control;
- **مجموعة جاهزة** or **خيارات خاصة بهذا الصنف**;
- direct option/price rows rather than generated Cartesian-combination machinery;
- **الإضافات العامة** and **إضافات خاصة بهذا الصنف** as separate concepts.

This is product meaning, not a temporary visual trick.

## Current affected surfaces

- `BO-SCREEN-001` — Shell and Navigation
- `BO-SCREEN-006` — Item List
- `BO-SCREEN-007` — Item Editor
- `BO-SCREEN-008` — Reusable Option Groups / Multiple Pricing
- `BO-SCREEN-009` — Categories
- `BO-SCREEN-011` — Add-ons
- `BO-FLOW-002` — Manage Catalog Items

## Current implementation layering

The final simplification layer remains:

- `apps/backoffice/src/loyverse-reference-pass.css`

It loads after earlier visual layers to flatten over-designed treatments.

`apps/backoffice/src/backoffice-layout-safety.css` protects the fixed topbar/right-navigation/workspace geometry. Future feature CSS must not casually override that shell geometry.

A later cleanup may consolidate historical CSS layers without changing the locked visual result.

## Boundaries

This lock does **not** authorize:

- copying Loyverse source code, proprietary assets or branded icons;
- importing donor schemas/IDs;
- changing Rifad contracts merely to resemble Loyverse;
- adding inventory, discounts, taxes or other capabilities solely because they exist in the reference;
- freezing production storage, synchronization, LAN or fiscal technology;
- changing already approved cashier/POS visual rules without separate authorization;
- introducing a mandatory online font dependency.

## Related evidence and decisions

- `docs/research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md`
- `docs/ui/VISUAL-DECISION-008-CATALOG-VISUAL-IDENTITY.md`
- `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`
- `docs/CURRENT_WORK_HANDOFF_2026-08-18.md`

The next cross-surface gate after this lock is synchronization candidate execution/adoption, not another general Back Office redesign.