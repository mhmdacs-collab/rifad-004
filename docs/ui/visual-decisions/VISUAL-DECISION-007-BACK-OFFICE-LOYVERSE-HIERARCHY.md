# VISUAL-DECISION-007 — Back Office Loyverse-like hierarchy

Last updated: 2026-08-18
Status: **APPROVED BY OWNER**

## Decision

For the current Rifad Back Office product-discovery phase, the owner explicitly approved the supplied Loyverse Back Office screenshots as the primary visual reference for the management shell and catalog administration surfaces.

This approval is visual/interaction hierarchy only. Rifad continues to own all contracts, data meanings, adapters, persistence boundaries and implementation code.

## Approved visual characteristics

The Back Office should stay visually close to the supplied reference in the following areas:

- full-width green application bar at the top;
- persistent RTL navigation rail on the right;
- compact administration navigation density rather than oversized dashboard navigation;
- pale gray workspace background with focused white management cards;
- thin borders, restrained shadows and low visual noise;
- lighter Arabic typography with clear hierarchy and materially less use of heavy/bold text;
- lime-green compact primary add/save actions;
- item/category/modifier lists presented as calm management tables;
- category rows may use UI-only color swatches for scanability until category color becomes an approved durable product field;
- item editing uses a narrow vertical stack of form cards rather than a wide dashboard-style editor;
- related item sections are visually separated into successive white cards;
- save/cancel actions sit at the end of the editing flow rather than dominating the top of the page;
- category and modifier editing use focused narrow forms consistent with the supplied reference.

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
- changing the already approved cashier/POS visual rules unless separately authorized.

The supplied screenshots are a reference for visual structure and usability. Rifad remains independently implemented.

## Current implementation checkpoint

The Back Office CSS was reworked on 2026-08-18 to apply this hierarchy to the existing executable catalog slice without adding new business capabilities. Functional behavior remains behind `CatalogAdminContract` and its replaceable adapter boundary.
