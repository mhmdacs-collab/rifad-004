# VISUAL-DECISION-007 — Back Office Loyverse-like hierarchy

Last updated: 2026-08-18
Status: **STRUCTURE APPROVED BY OWNER — FINAL VISUAL ACCEPTANCE STILL PENDING**

## Decision

For the current Rifad Back Office product-discovery phase, the owner explicitly approved the supplied Loyverse Back Office screenshots as the primary visual reference for the management shell and catalog-administration surfaces.

This approval is visual/interaction hierarchy only. Rifad continues to own all contracts, data meanings, adapters, persistence boundaries and implementation code.

The owner repeatedly identified the remaining gap not as missing decoration but as the feeling of a modern, calm, obvious product: coherent typography, restrained colors, meaningful icons, consistent spacing, smooth hierarchy and merchant-facing simplicity.

The key lesson from the latest runtime comparison is:

> **Modernity comes from discipline and removal, not from adding visual effects.**

The structural reference remains accepted. The current simplified visual pass is **not yet owner-accepted as final** and must remain directly reviewable at runtime.

## Approved visual characteristics

The Back Office should stay visually close to the supplied reference in the following areas:

- full-width application bar at the top using **Rifad primary green `#0A714E`**, not donor/lime green;
- persistent RTL navigation rail on the right;
- compact administration navigation density rather than oversized dashboard navigation;
- pale gray workspace background with focused white management cards;
- thin borders and restrained/no shadows where separation is already clear;
- avoid decorative gradients in ordinary management surfaces;
- Arabic typography uses a **Cairo-first** stack with practical Windows/browser fallbacks and must be judged at normal 1920×1080 viewing distance, not screenshot zoom;
- list/form text must be comfortably readable and visually coherent rather than reproducing tiny legacy-admin typography;
- add, save, delete and back actions use consistent line pictograms in addition to Arabic wording where wording helps;
- hover/focus/selected states are calm but immediately recognizable;
- tables prioritize scanning speed over decorative density;
- item editing uses a focused vertical management form rather than a wide dashboard-style editor;
- use one calm Save/Cancel completion area for the item form; the latest owner comparison rejected duplicate Save/Cancel areas as unnecessary visual noise;
- category, option-group and add-on editing use focused forms rather than technical developer-style builders;
- product preview/representation controls stay compact and practical instead of becoming a hero/marketing card;
- Rifad identity is visible through brand color, typography, action treatment and interaction feedback without changing the accepted management hierarchy.

## Visual anti-patterns discovered during implementation

Do not repeat these mistakes:

1. giant page headings inside ordinary admin forms;
2. large decorative empty margins around an unnecessarily narrow editor;
3. nested card-inside-card-inside-panel structures;
4. gradients or heavy shadows intended to simulate a “2026” feeling;
5. oversized product preview blocks;
6. excessive bold text;
7. repeated primary actions that compete for attention;
8. CSS polish layers changing the topbar/sidebar/workspace geometry;
9. tiny Arabic typography copied from legacy enterprise UI;
10. adding decoration where a divider, spacing or typography difference would communicate hierarchy better.

## Merchant-simplicity refinement

The product review also rejected technical **variant / Cartesian-combination** language as the primary merchant experience.

The current target presentation is:

- **مجموعات الخيارات** as reusable merchant-managed groups;
- **أسعار متعددة** as one clear switch inside the item editor;
- a calm choice between **مجموعة جاهزة** and **خيارات خاصة بهذا الصنف**;
- direct option/price rows instead of generated-combination machinery;
- **الإضافات العامة** and **إضافات خاصة بهذا الصنف** as visibly separate concepts.

This simplification is both product and visual hierarchy. It is intentionally designed for a business owner managing many similar items.

## Current affected surfaces

- `BO-SCREEN-001` — Shell and Navigation
- `BO-SCREEN-006` — Item List
- `BO-SCREEN-007` — Item Editor
- `BO-SCREEN-008` — Reusable Option Groups / Multiple Pricing
- `BO-SCREEN-009` — Categories
- `BO-SCREEN-011` — Add-ons
- `BO-FLOW-002` — Manage Catalog Items

## Current implementation layering

The Back Office currently loads several historical/current CSS layers. The latest simplification layer is:

- `apps/backoffice/src/loyverse-reference-pass.css`

It is loaded after the other visual layers and exists specifically to flatten over-designed treatments and restore the owner-approved calm reference feel.

`apps/backoffice/src/backoffice-layout-safety.css` protects the shell geometry. Visual-polish layers must not move the fixed topbar/right navigation/independent workspace regions.

This layering is a current implementation checkpoint, not a recommendation to accumulate endless override files. A future cleanup/consolidation may simplify CSS ownership after the visual direction is accepted.

## Boundaries

This decision does **not** authorize:

- copying Loyverse source code, proprietary assets or exact branded icons;
- importing donor database schemas or IDs;
- changing Rifad catalog contracts merely to resemble Loyverse;
- implementing inventory, discounts, taxes, suppliers or other Back Office capabilities only because they appear in the reference screenshots;
- freezing production storage, LAN, branch Sync or fiscal integration design;
- changing already approved cashier/POS visual rules unless separately authorized;
- introducing a mandatory online font dependency as a hidden runtime requirement.

The supplied screenshots are a reference for visual structure and usability. Rifad remains independently implemented.

## Related evidence and decisions

- `docs/research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md`
- `docs/ui/VISUAL-DECISION-008-CATALOG-VISUAL-IDENTITY.md`
- `docs/CURRENT_WORK_HANDOFF_2026-08-18.md`

Owner visual acceptance of the latest simplified pass remains pending direct runtime review.
