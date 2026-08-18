# VISUAL-DECISION-007 — Back Office Loyverse-like hierarchy

Last updated: 2026-08-18
Status: **STRUCTURE APPROVED BY OWNER — RIFAD 2026 POLISH UNDER ACTIVE VISUAL REVIEW**

## Decision

For the current Rifad Back Office product-discovery phase, the owner explicitly approved the supplied Loyverse Back Office screenshots as the primary visual reference for the management shell and catalog-administration surfaces.

This approval is visual/interaction hierarchy only. Rifad continues to own all contracts, data meanings, adapters, persistence boundaries and implementation code.

The owner rated the first close structural pass at roughly 70% and explicitly identified the remaining gap as the feeling of a modern 2026 product: smoother hierarchy, coherent readable typography, calm colors, meaningful icons, better micro-spacing and simpler merchant-facing workflows.

The structural reference remains accepted. The latest Rifad 2026 polish layer is **not yet visually accepted** and must remain reviewable rather than being treated as final design authority.

## Approved visual characteristics

The Back Office should stay visually close to the supplied reference in the following areas:

- full-width application bar at the top using **Rifad primary green `#0A714E`**, not donor/lime green;
- persistent RTL navigation rail on the right;
- compact administration navigation density rather than oversized dashboard navigation;
- pale gray workspace background with focused white management cards;
- thin borders, restrained shadows and low visual noise;
- Arabic typography uses a **Cairo-first** stack with practical Windows/browser fallbacks and must be judged at normal 1920×1080 viewing distance, not screenshot zoom;
- list/form text must be comfortably readable and visually coherent rather than reproducing tiny legacy-admin typography;
- primary actions use Rifad green with a practical 46–48px class target in desktop management surfaces where space allows;
- add, save, delete and back actions use consistent line pictograms in addition to Arabic action wording where wording is useful;
- hover/focus/selected states are calm but immediately recognizable;
- tables prioritize scanning speed over decorative density;
- item editing uses a focused vertical stack of cards rather than a wide dashboard-style editor;
- repeated save access may appear at both top and bottom of a long editor while preserving the same label/meaning;
- category, option-group and add-on editing use focused forms rather than technical developer-style builders;
- Rifad identity must be visible through brand color, typography, action treatment and interaction feedback without changing the accepted management hierarchy.

## Merchant-simplicity refinement

The visual/product review also rejected technical **variant / Cartesian-combination** language as the primary merchant experience.

The current target presentation is:

- **مجموعات الخيارات** as reusable merchant-managed groups;
- **أسعار متعددة** as one clear switch inside the item editor;
- a calm segmented choice between **مجموعة جاهزة** and **خيارات خاصة بهذا الصنف**;
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

## Boundaries

This decision does **not** authorize:

- copying Loyverse source code, proprietary assets or exact branded icons;
- importing donor database schemas or IDs;
- changing Rifad catalog contracts merely to resemble Loyverse;
- implementing inventory, discounts, taxes, suppliers or other Back Office capabilities only because they appear in the reference screenshots;
- freezing production storage, LAN, branch Sync or fiscal integration design;
- changing the already approved cashier/POS visual rules unless separately authorized;
- introducing a mandatory online font dependency as a hidden runtime requirement.

The supplied screenshots are a reference for visual structure and usability. Rifad remains independently implemented.

## Current implementation checkpoint

The Back Office retains the owner-approved Loyverse-like management hierarchy and loads Rifad-owned visual layers last. The current `backoffice-2026.css` pass adds Rifad typography/color/action/icon/micro-interaction treatment plus modern switch, segmented-control, pricing-row and add-on-row patterns.

Functional behavior remains behind `CatalogAdminContract` and its replaceable adapter boundary.

Owner visual acceptance of this latest pass remains pending direct runtime review.
