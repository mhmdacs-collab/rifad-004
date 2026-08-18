# VISUAL-DECISION-007 — Back Office Loyverse-like hierarchy

Last updated: 2026-08-18
Status: **APPROVED BY OWNER — REFINED WITH RIFAD VISUAL IDENTITY**

## Decision

For the current Rifad Back Office product-discovery phase, the owner explicitly approved the supplied Loyverse Back Office screenshots as the primary visual reference for the management shell and catalog administration surfaces.

This approval is visual/interaction hierarchy only. Rifad continues to own all contracts, data meanings, adapters, persistence boundaries and implementation code.

The owner subsequently reviewed the first executable pass at normal desktop scale and approved the hierarchy as a materially better direction, while explicitly requesting a Rifad-specific polish pass: official Rifad colors, clearer typography, slightly larger actions and meaningful action icons.

## Approved visual characteristics

The Back Office should stay visually close to the supplied reference in the following areas:

- full-width application bar at the top using **Rifad primary green `#0A714E`**, not donor/lime green;
- persistent RTL navigation rail on the right;
- compact administration navigation density rather than oversized dashboard navigation;
- pale gray workspace background with focused white management cards;
- thin borders, restrained shadows and low visual noise;
- Arabic typography uses a **Cairo-first** stack with practical Windows/browser fallbacks and must be judged at normal 1920×1080 viewing distance, not screenshot zoom;
- important list/form text must remain materially clearer than the first 10–12px prototype pass;
- primary add/save actions use Rifad green and are slightly larger than the first compact prototype so their purpose is immediately visible;
- add, save, delete and back actions should use clear pictograms **in addition to Arabic labels** where a label exists; icons do not replace action wording;
- item/category/modifier lists are presented as calm management tables with clear hover/focus feedback;
- category rows may use UI-only color swatches for scanability until category color becomes an approved durable product field;
- item editing uses a narrow vertical stack of form cards rather than a wide dashboard-style editor;
- related item sections are visually separated into successive white cards;
- save/cancel actions sit at the end of the editing flow rather than dominating the top of the page;
- category and modifier editing use focused narrow forms consistent with the supplied reference;
- Rifad identity must be visible through brand color, typography, action treatment and interaction feedback without changing the approved Loyverse-like management hierarchy.

## Current affected surfaces

- `BO-SCREEN-001` — Shell and Navigation
- `BO-SCREEN-006` — Item List
- `BO-SCREEN-007` — Item Editor
- `BO-SCREEN-008` — Variants inside item administration
- `BO-SCREEN-009` — Categories
- `BO-SCREEN-011` — Modifiers
- `BO-FLOW-002` — Manage Catalog Items

## Boundaries

This decision does **not** authorize:

- copying Loyverse source code, proprietary assets or exact branded icons;
- importing donor database schemas or IDs;
- changing Rifad catalog contracts merely to resemble Loyverse;
- implementing inventory, discounts, taxes, suppliers or other Back Office capabilities only because they appear in the reference screenshots;
- freezing production storage, LAN, branch Sync or fiscal integration design;
- changing the already approved cashier/POS visual rules unless separately authorized;
- introducing a mandatory online font dependency as a hidden runtime requirement. Cairo is the preferred face, but the interface must remain readable with the declared local fallbacks.

The supplied screenshots are a reference for visual structure and usability. Rifad remains independently implemented.

## Current implementation checkpoint

The Back Office keeps the owner-approved Loyverse-like hierarchy and now layers Rifad-owned polish through `apps/backoffice/src/rifad-polish.css` after the structural/reference styles. The layer applies the official Rifad palette, a Cairo-first typography stack, larger human-readable controls, stronger table/form optical scale, branded focus/hover states and CSS/SVG action pictograms without changing business behavior.

Functional behavior remains behind `CatalogAdminContract` and its replaceable adapter boundary.
